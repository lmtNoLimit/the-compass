import { useLoaderData } from 'react-router';

export async function loader() {
  return { briefs: [] };
}

export default function BriefsIndex() {
  const { briefs } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Feature Briefs</h1>
      {briefs.length === 0 ? (
        <p className="text-gray-500">No briefs yet. Create your first one!</p>
      ) : (
        <div className="grid gap-4">{/* Brief list will go here */}</div>
      )}
    </div>
  );
}
