'use client';

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Coming Soon
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Goshme.com is coming soon. Stay tuned.
        </p>
      </div>
    </div>
  );
}
