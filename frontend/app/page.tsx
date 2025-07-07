// NECTA Frontend Main Page
// This will be the main chat interface

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-foreground">
          NECTA - Chat Interface for n8n AI Agents
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect with your n8n AI agents through secure webhook communication.
        </p>
      </div>
    </main>
  );
}