# Launch Notes

The launch plan assumes a small, curated document set bundled directly with the application deployment.

Version one will run on Vercel using a server-side Node.js route for question answering. The bundled retrieval index is generated before deployment and shipped with the app.

Because the runtime is serverless, the deployment should not depend on rebuilding embeddings during request handling. If the Gemini API key is missing during build time, the app can still render the document list, but question answering stays disabled until the index is regenerated.

PDF files must be text-readable in version one. Scanned PDFs are not supported.
