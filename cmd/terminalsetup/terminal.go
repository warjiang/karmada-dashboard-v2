/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package terminalsetup

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/karmada-io/dashboard/cmd/api/app/types/common"
	"github.com/karmada-io/dashboard/pkg/client"
	"github.com/pkg/errors"
	"gopkg.in/igm/sockjs-go.v2/sockjs"
	"io"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	scheme "k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	"k8s.io/client-go/tools/remotecommand"
	"k8s.io/utils/pointer"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// waitForPodReady polls until the Pod is Running and Ready, or times out.
func waitForPodReady(
	ctx context.Context,
	clientset kubernetes.Interface,
	namespace, podName string,
) error {
	return wait.PollUntilContextTimeout(
		ctx,
		5*time.Second,
		5*time.Minute,
		true,
		func(ctx context.Context) (bool, error) {
			pod, err := clientset.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
			if err != nil {
				return false, err
			}
			if pod.Status.Phase != corev1.PodRunning {
				return false, nil
			}
			for _, cond := range pod.Status.Conditions {
				if cond.Type == corev1.PodReady && cond.Status == corev1.ConditionTrue {
					return true, nil
				}
			}
			return false, nil
		},
	)
}

func createTTYdPod(ctx context.Context, clientset kubernetes.Interface) (*corev1.Pod, error) {
	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: "ttyd-",
			Namespace:    "karmada-system",
			Labels:       map[string]string{"app": "dashboard-ttyd"},
		},
		Spec: corev1.PodSpec{
			SecurityContext: &corev1.PodSecurityContext{
				FSGroup: pointer.Int64Ptr(0),
			},
			ServiceAccountName: "default",
			DNSPolicy:          corev1.DNSClusterFirst,
			EnableServiceLinks: pointer.BoolPtr(true),
			Volumes: []corev1.Volume{
				{
					Name: "kube-api-access",
					VolumeSource: corev1.VolumeSource{Projected: &corev1.ProjectedVolumeSource{
						DefaultMode: pointer.Int32Ptr(420),
						Sources: []corev1.VolumeProjection{
							{ServiceAccountToken: &corev1.ServiceAccountTokenProjection{Path: "token", ExpirationSeconds: pointer.Int64Ptr(3607)}},
							{ConfigMap: &corev1.ConfigMapProjection{LocalObjectReference: corev1.LocalObjectReference{Name: "kube-root-ca.crt"}, Items: []corev1.KeyToPath{{Key: "ca.crt", Path: "ca.crt"}}}},
							{DownwardAPI: &corev1.DownwardAPIProjection{Items: []corev1.DownwardAPIVolumeFile{{Path: "namespace", FieldRef: &corev1.ObjectFieldSelector{FieldPath: "metadata.namespace"}}}}},
						},
					}},
				},
				{
					Name: "kubeconfig-dir", // Volume for /home/ttyd/.kube
					VolumeSource: corev1.VolumeSource{
						EmptyDir: &corev1.EmptyDirVolumeSource{},
					},
				},
			},

			Containers: []corev1.Container{
				{
					Name:            "ttyd",
					Image:           "docker.io/sayem4604/ttyd:latest",
					ImagePullPolicy: corev1.PullIfNotPresent,
					//  ◀️ Set this per‑container
					SecurityContext: &corev1.SecurityContext{
						RunAsUser:  pointer.Int64Ptr(0),
						RunAsGroup: pointer.Int64Ptr(0),
					},

					Ports: []corev1.ContainerPort{
						{ContainerPort: 7681, Name: "tcp", Protocol: corev1.ProtocolTCP},
					},
					LivenessProbe: &corev1.Probe{
						ProbeHandler: corev1.ProbeHandler{
							TCPSocket: &corev1.TCPSocketAction{Port: intstr.FromInt(7681)},
						},
						InitialDelaySeconds: 5,
						PeriodSeconds:       10,
						TimeoutSeconds:      1,
						SuccessThreshold:    1,
						FailureThreshold:    3,
					},
					ReadinessProbe: &corev1.Probe{
						ProbeHandler: corev1.ProbeHandler{
							TCPSocket: &corev1.TCPSocketAction{Port: intstr.FromInt(7681)},
						},
						InitialDelaySeconds: 5,
						PeriodSeconds:       10,
						TimeoutSeconds:      1,
						SuccessThreshold:    1,
						FailureThreshold:    3,
					},
					VolumeMounts: []corev1.VolumeMount{
						{
							Name:      "kube-api-access",
							MountPath: "/var/run/secrets/kubernetes.io/serviceaccount",
							ReadOnly:  true,
						},
						{
							Name:      "kubeconfig-dir",   // mount the EmptyDir volume
							MountPath: "/home/ttyd/.kube", // into the .kube dir
						},
					},
				},
			},
			RestartPolicy: corev1.RestartPolicyAlways,
		},
	}

	created, err := clientset.CoreV1().Pods(pod.Namespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create ttyd Pod: %w", err)
	}

	// ✅ Merge-patch just the label (no race on resourceVersion)
	patch := []byte(fmt.Sprintf(`{"metadata":{"labels":{"pod-name":"%s"}}}`, created.Name))
	if _, err := clientset.CoreV1().
		Pods(created.Namespace).
		Patch(ctx, created.Name, types.MergePatchType, patch, metav1.PatchOptions{}); err != nil {
		return nil, fmt.Errorf("failed to patch pod with pod-name: %w", err)
	}

	// Wait for Pod to be ready
	fmt.Println("Waiting for Pod to become Ready...")
	if err := waitForPodReady(ctx, clientset, created.Namespace, created.Name); err != nil {
		return nil, fmt.Errorf("pod did not become ready: %w", err)
	}
	fmt.Printf("✅ Pod %s is ready\n", created.Name)
	return created, nil
}

// GenerateKubeConfig builds an in-memory kubeconfig with the provided token.
func GenerateKubeConfig(token string) ([]byte, error) {
	cfg := clientcmdapi.Config{
		APIVersion: "v1",
		Kind:       "Config",
		Clusters: map[string]*clientcmdapi.Cluster{
			"karmada-apiserver": {
				Server:                "https://karmada-apiserver.karmada-system.svc.cluster.local:5443",
				InsecureSkipTLSVerify: true,
			},
		},
		AuthInfos: map[string]*clientcmdapi.AuthInfo{
			"karmada-apiserver": {
				Token: token, // Use the passed token for authentication
			},
		},
		Contexts: map[string]*clientcmdapi.Context{
			"karmada-apiserver": {
				Cluster:  "karmada-apiserver", // Link context to the cluster
				AuthInfo: "karmada-apiserver", // Link context to the user
			},
		},
		CurrentContext: "karmada-apiserver", // Set the current context
	}

	// Write the config to byte array and return
	return clientcmd.Write(cfg)
}

func ExecIntoPodWithInput(
	ctx context.Context,
	restCfg *rest.Config,
	clientset kubernetes.Interface,
	namespace, podName, containerName string,
	command []string,
	stdinData []byte,
) error {
	req := clientset.CoreV1().
		RESTClient().
		Post().
		Resource("pods").
		Name(podName).
		Namespace(namespace).
		SubResource("exec").
		VersionedParams(
			&corev1.PodExecOptions{
				Container: containerName,
				Command:   command,
				Stdin:     len(stdinData) > 0,
				Stdout:    true,
				Stderr:    true,
				TTY:       false,
			},
			scheme.ParameterCodec,
		)

	executor, err := remotecommand.NewSPDYExecutor(restCfg, "POST", req.URL())
	if err != nil {
		return fmt.Errorf("failed to init executor: %w", err)
	}

	var stdoutBuf, stderrBuf bytes.Buffer
	execCtx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	err = executor.StreamWithContext(execCtx, remotecommand.StreamOptions{
		Stdin:  bytes.NewReader(stdinData),
		Stdout: &stdoutBuf,
		Stderr: &stderrBuf,
		Tty:    false,
	})

	if err != nil {
		return fmt.Errorf("exec failed: %w\nSTDOUT:\n%s\nSTDERR:\n%s", err, stdoutBuf.String(), stderrBuf.String())
	}

	if stderrBuf.Len() > 0 {
		fmt.Printf("⚠️ stderr during exec: %s\n", stderrBuf.String())
	}

	return nil
}

func createTTYDNodePortService(ctx context.Context, clientset kubernetes.Interface, podName string) (*corev1.Service, error) {
	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      podName + "-svc",
			Namespace: "karmada-system",
			Labels:    map[string]string{"app": "dashboard-ttyd"},
		},
		Spec: corev1.ServiceSpec{
			Type: corev1.ServiceTypeNodePort,
			Selector: map[string]string{
				// Assuming the Pod has this label — or set your own here
				//"app": "dashboard-ttyd",
				"pod-name": podName,
			},
			Ports: []corev1.ServicePort{
				{
					Name:       "ws",
					Port:       7681,
					TargetPort: intstr.FromInt(7681),
					//NodePort:   30081, // optional:  omit for random
					Protocol: corev1.ProtocolTCP,
				},
			},
		},
	}

	createdSvc, err := clientset.CoreV1().Services("karmada-system").Create(ctx, svc, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create NodePort Service: %w", err)
	}

	fmt.Printf("✅ NodePort Service %s created\n", createdSvc.Name)
	return createdSvc, nil
}

// TriggerTerminal handles the HTTP request to set up a ttyd pod and inject kubeconfig.
// TriggerTerminal handles the HTTP request to set up a ttyd pod and inject kubeconfig.
func TriggerTerminal(c *gin.Context) {
	ctx := c.Request.Context()

	// 1) Grab Kubernetes REST config and clientset from your shared pkg
	//restCfg, _, err := client.GetKubeConfig()
	// Load whichever config InitKubeConfig() set up (in‑cluster or local kubeconfig)
	restCfg, _, err := client.GetKubeConfig()
	if err != nil {
		common.Fail(c, fmt.Errorf("failed to load kube config: %w", err))
		return
	}

	// then get the clientset
	k8sClient := client.InClusterClient()
	if k8sClient == nil {
		common.Fail(c, fmt.Errorf("failed to initialize Kubernetes client"))
		return
	}

	// 2) Create the ttyd Pod
	pod, err := createTTYdPod(ctx, k8sClient)
	if err != nil {
		common.Fail(c, fmt.Errorf("create ttyd pod failed: %w", err))
		return
	}

	// container name from the Pod spec
	containerName := pod.Spec.Containers[0].Name

	// Extract the user Bearer token from the request
	auth := c.GetHeader("Authorization")
	var token string
	if strings.HasPrefix(auth, "Bearer ") {
		token = strings.TrimPrefix(auth, "Bearer ")
	}

	//  Generate an in‑memory kubeconfig for that token
	kubecfgBytes, err := GenerateKubeConfig(token)
	if err != nil {
		common.Fail(c, fmt.Errorf("generate kubeconfig failed: %w", err))
		return
	}

	//  Inject the kubeconfig into the pod via `cat > /home/ttyd/.kube/config`
	if err := ExecIntoPodWithInput(
		ctx, restCfg, k8sClient,
		pod.Namespace, pod.Name, containerName,
		[]string{"sh", "-c", "cat > /home/ttyd/.kube/config"},
		kubecfgBytes,
	); err != nil {
		common.Fail(c, fmt.Errorf("inject kubeconfig failed: %w", err))
		return
	}

	// 2) Expose the Pod via a NodePort Service
	svc, err := createTTYDNodePortService(ctx, k8sClient, pod.Name)
	if err != nil {
		common.Fail(c, fmt.Errorf("failed to create service: %w", err))
		return
	}

	// 3) Read the port Kubernetes assigned
	port := svc.Spec.Ports[0].NodePort

	// 4) Send back a single JSON payload with podName & port
	common.Success(c, map[string]string{
		"podName": pod.Name,
		"port":    fmt.Sprint(port),
	})

	// 8) All done—return the Pod name so the frontend can open a socket
	//common.Success(c, map[string]string{"podName": pod.Name})
}

func CreateTtydPod(c *gin.Context) {
	k8sClient := client.InClusterClient()
	if k8sClient == nil {
		common.Fail(c, fmt.Errorf("failed to initialize Kubernetes client"))
		return
	}
	// podName: karmada-ttyd-${username}
	pod := corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "karmada-ttyd-admin",
			Namespace: "karmada-system",
		},
		Spec: corev1.PodSpec{
			Containers: []corev1.Container{
				{
					Image:           "sayem4604/ttyd",
					ImagePullPolicy: corev1.PullIfNotPresent,
					Name:            "karmada-ttyd-admin",
					Ports: []corev1.ContainerPort{
						{
							ContainerPort: 7681,
							Name:          "tcp",
							Protocol:      "TCP",
						},
					},
					LivenessProbe: &corev1.Probe{
						FailureThreshold:    3,
						InitialDelaySeconds: 5,
						PeriodSeconds:       10,
						SuccessThreshold:    1,
						ProbeHandler: corev1.ProbeHandler{
							TCPSocket: &corev1.TCPSocketAction{
								Port: intstr.FromInt32(7681),
							},
						},
						TimeoutSeconds: 10,
					},
					ReadinessProbe: &corev1.Probe{
						FailureThreshold:    3,
						InitialDelaySeconds: 5,
						PeriodSeconds:       10,
						SuccessThreshold:    1,
						ProbeHandler: corev1.ProbeHandler{
							TCPSocket: &corev1.TCPSocketAction{
								Port: intstr.FromInt32(7681),
							},
						},
						TimeoutSeconds: 10,
					},
				},
			},
		},
	}

	// todo recheck the pod exist
	// Create the Pod
	_, err := k8sClient.CoreV1().Pods("karmada-system").Create(context.TODO(), &pod, metav1.CreateOptions{})
	if err != nil {
		common.Fail(c, errors.Wrap(err, "failed to create pod"))
		return
	}
	common.Success(c, "ok")
}

const END_OF_TRANSMISSION = "\u0004"

// PtyHandler is what remotecommand expects from a pty
type PtyHandler interface {
	io.Reader
	io.Writer
	remotecommand.TerminalSizeQueue
}

// TerminalSession implements PtyHandler (using a SockJS connection)
type TerminalSession struct {
	id            string
	bound         chan error
	sockJSSession sockjs.Session
	sizeChan      chan remotecommand.TerminalSize
}

// TerminalMessage is the messaging protocol between ShellController and TerminalSession.
//
// OP      DIRECTION  FIELD(S) USED  DESCRIPTION
// ---------------------------------------------------------------------
// bind    fe->be     SessionID      Id sent back from TerminalResponse
// stdin   fe->be     Data           Keystrokes/paste buffer
// resize  fe->be     Rows, Cols     New terminal size
// stdout  be->fe     Data           Output from the process
// toast   be->fe     Data           OOB message to be shown to the user
type TerminalMessage struct {
	Op, Data, SessionID string
	Rows, Cols          uint16
}

// Next handles pty->process resize events
// Called in a loop from remotecommand as long as the process is running
func (t TerminalSession) Next() *remotecommand.TerminalSize {
	size := <-t.sizeChan
	if size.Height == 0 && size.Width == 0 {
		return nil
	}
	return &size
}

// Read handles pty->process messages (stdin, resize)
// Called in a loop from remotecommand as long as the process is running
func (t TerminalSession) Read(p []byte) (int, error) {
	m, err := t.sockJSSession.Recv()
	if err != nil {
		// Send terminated signal to process to avoid resource leak
		return copy(p, END_OF_TRANSMISSION), err
	}

	var msg TerminalMessage
	if err := json.Unmarshal([]byte(m), &msg); err != nil {
		return copy(p, END_OF_TRANSMISSION), err
	}

	switch msg.Op {
	case "stdin":
		return copy(p, msg.Data), nil
	case "resize":
		t.sizeChan <- remotecommand.TerminalSize{Width: msg.Cols, Height: msg.Rows}
		return 0, nil
	default:
		return copy(p, END_OF_TRANSMISSION), fmt.Errorf("unknown message type '%s'", msg.Op)
	}
}

// Write handles process->pty stdout
// Called from remotecommand whenever there is any output
func (t TerminalSession) Write(p []byte) (int, error) {
	msg, err := json.Marshal(TerminalMessage{
		Op:   "stdout",
		Data: string(p),
	})
	if err != nil {
		return 0, err
	}

	if err = t.sockJSSession.Send(string(msg)); err != nil {
		return 0, err
	}
	return len(p), nil
}

// Toast can be used to send the user any OOB messages
// hterm puts these in the center of the terminal
func (t TerminalSession) Toast(p string) error {
	msg, err := json.Marshal(TerminalMessage{
		Op:   "toast",
		Data: p,
	})
	if err != nil {
		return err
	}

	if err = t.sockJSSession.Send(string(msg)); err != nil {
		return err
	}
	return nil
}

// SessionMap stores a map of all TerminalSession objects and a lock to avoid concurrent conflict
type SessionMap struct {
	Sessions map[string]TerminalSession
	Lock     sync.RWMutex
}

// Get return a given terminalSession by sessionId
func (sm *SessionMap) Get(sessionId string) TerminalSession {
	sm.Lock.RLock()
	defer sm.Lock.RUnlock()
	return sm.Sessions[sessionId]
}

// Set store a TerminalSession to SessionMap
func (sm *SessionMap) Set(sessionId string, session TerminalSession) {
	sm.Lock.Lock()
	defer sm.Lock.Unlock()
	sm.Sessions[sessionId] = session
}

// Close shuts down the SockJS connection and sends the status code and reason to the client
// Can happen if the process exits or if there is an error starting up the process
// For now the status code is unused and reason is shown to the user (unless "")
func (sm *SessionMap) Close(sessionId string, status uint32, reason string) {
	sm.Lock.Lock()
	defer sm.Lock.Unlock()
	ses := sm.Sessions[sessionId]
	err := ses.sockJSSession.Close(status, reason)
	if err != nil {
		log.Println(err)
	}
	close(ses.sizeChan)
	delete(sm.Sessions, sessionId)
}

var terminalSessions = SessionMap{Sessions: make(map[string]TerminalSession)}

// handleTerminalSession is Called by net/http for any new /api/sockjs connections
func handleTerminalSession(session sockjs.Session) {
	var (
		buf             string
		err             error
		msg             TerminalMessage
		terminalSession TerminalSession
	)

	if buf, err = session.Recv(); err != nil {
		log.Printf("handleTerminalSession: can't Recv: %v", err)
		return
	}

	if err = json.Unmarshal([]byte(buf), &msg); err != nil {
		log.Printf("handleTerminalSession: can't UnMarshal (%v): %s", err, buf)
		return
	}

	if msg.Op != "bind" {
		log.Printf("handleTerminalSession: expected 'bind' message, got: %s", buf)
		return
	}

	if terminalSession = terminalSessions.Get(msg.SessionID); terminalSession.id == "" {
		log.Printf("handleTerminalSession: can't find session '%s'", msg.SessionID)
		return
	}

	terminalSession.sockJSSession = session
	terminalSessions.Set(msg.SessionID, terminalSession)
	terminalSession.bound <- nil
}

// CreateAttachHandler is called from main for /api/sockjs
func CreateAttachHandler(path string) http.Handler {
	return sockjs.NewHandler(path, sockjs.DefaultOptions, handleTerminalSession)
}

// startProcess is called by handleAttach
// Executed cmd in the container specified in request and connects it up with the ptyHandler (a session)
func startProcess(k8sClient kubernetes.Interface, cfg *rest.Config, request *gin.Context, cmd []string, ptyHandler PtyHandler) error {
	namespace := request.Param("namespace")
	podName := request.Param("pod")
	containerName := request.Param("container")

	req := k8sClient.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(podName).
		Namespace(namespace).
		SubResource("exec")

	req.VersionedParams(&corev1.PodExecOptions{
		Container: containerName,
		Command:   cmd,
		Stdin:     true,
		Stdout:    true,
		Stderr:    true,
		TTY:       true,
	}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(cfg, "POST", req.URL())
	if err != nil {
		return err
	}

	err = exec.Stream(remotecommand.StreamOptions{
		Stdin:             ptyHandler,
		Stdout:            ptyHandler,
		Stderr:            ptyHandler,
		TerminalSizeQueue: ptyHandler,
		Tty:               true,
	})
	if err != nil {
		return err
	}

	return nil
}

// genTerminalSessionId generates a random session ID string. The format is not really interesting.
// This ID is used to identify the session when the client opens the SockJS connection.
// Not the same as the SockJS session id! We can't use that as that is generated
// on the client side and we don't have it yet at this point.
func genTerminalSessionId() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	id := make([]byte, hex.EncodedLen(len(bytes)))
	hex.Encode(id, bytes)
	return string(id), nil
}

// isValidShell checks if the shell is an allowed one
func isValidShell(validShells []string, shell string) bool {
	for _, validShell := range validShells {
		if validShell == shell {
			return true
		}
	}
	return false
}

// WaitForTerminal is called from apihandler.handleAttach as a goroutine
// Waits for the SockJS connection to be opened by the client the session to be bound in handleTerminalSession
func WaitForTerminal(k8sClient kubernetes.Interface, cfg *rest.Config, request *gin.Context, sessionId string) {
	shell := request.Query("shell")

	select {
	case <-terminalSessions.Get(sessionId).bound:
		close(terminalSessions.Get(sessionId).bound)

		var err error
		validShells := []string{"bash", "sh", "powershell", "cmd"}

		if isValidShell(validShells, shell) {
			cmd := []string{shell}
			err = startProcess(k8sClient, cfg, request, cmd, terminalSessions.Get(sessionId))
		} else {
			// No shell given or it was not valid: try some shells until one succeeds or all fail
			// FIXME: if the first shell fails then the first keyboard event is lost
			for _, testShell := range validShells {
				cmd := []string{testShell}
				if err = startProcess(k8sClient, cfg, request, cmd, terminalSessions.Get(sessionId)); err == nil {
					break
				}
			}
		}

		if err != nil {
			terminalSessions.Close(sessionId, 2, err.Error())
			return
		}

		terminalSessions.Close(sessionId, 1, "Process exited")

	case <-time.After(20 * time.Second):
		// Close chan and delete session when sockjs connection was timeout
		close(terminalSessions.Get(sessionId).bound)
		delete(terminalSessions.Sessions, sessionId)
		return
	}
}
