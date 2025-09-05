import { useLoaderData } from 'react-router';

export async function loader() {
  return { validations: [] };
}

export default function ValidationsIndex() {
  const { validations } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Validations</h1>
      {validations.length === 0 ? (
        <p className="text-gray-500">No validations yet.</p>
      ) : (
        <div className="grid gap-4">{/* Validation list will go here */}</div>
      )}
    </div>
  );
}
