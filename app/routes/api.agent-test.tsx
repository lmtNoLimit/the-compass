import type { Route } from '../+types/root';

export async function loader(_args: Route.LoaderArgs) {
  const response = {
    success: true,
    message: 'Agent test endpoint is working',
    details: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'not-configured',
      location: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
      testResponse: 'Basic connectivity test passed',
    },
  };

  return Response.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

export async function action(args: Route.ActionArgs) {
  try {
    const body = await args.request.json();

    if (!body.prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = {
      agent: 'test-agent',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      response: `Echo: ${body.prompt}`,
      status: 'success',
      metadata: {
        testMode: true,
        receivedPrompt: body.prompt,
      },
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return Response.json(
      {
        agent: 'test-agent',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        response: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}