'use client';

import { LoaderCircle } from "lucide-react";
import { useRouter } from 'next/navigation'

export default function NotFound() {
    const router = useRouter();
    router.push("/");
    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <LoaderCircle className="animate-spin text-primary" size="64" />
        </div>
    );
}