"use client";

import { useAuth } from "@clerk/nextjs";

const Page = () => {
  const { signOut } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
      <h1 className="text-4xl font-bold text-red-500">Acceso no autorizado</h1>
      <p className="text-gray-600 dark:text-gray-400">
        No tienes los permisos necesarios para ver esta página.
      </p>
      <button
        onClick={() => signOut()}
        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Page;