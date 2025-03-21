package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
)

// headerMiddleware adds the required headers for SharedArrayBuffer support
func headerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set headers required for SharedArrayBuffer
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Define command line flags
	port := flag.Int("port", 8080, "Port to serve on")
	dir := flag.String("dir", "./web", "Directory to serve static files from")
	flag.Parse()

	// Get the absolute path for the web directory
	absDir, err := filepath.Abs(*dir)
	if err != nil {
		log.Fatalf("Error getting absolute path: %v", err)
	}

	// Create file server handler
	fs := http.FileServer(http.Dir(absDir))

	// Set up the HTTP server with the header middleware
	http.Handle("/", headerMiddleware(fs))

	// Start the server
	serverAddr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Starting server at http://localhost%s\n", serverAddr)
	fmt.Printf("Serving files from %s\n", absDir)
	fmt.Println("CORS headers enabled for SharedArrayBuffer support")

	err = http.ListenAndServe(serverAddr, nil)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
