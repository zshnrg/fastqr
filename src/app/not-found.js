'use client';

import { LoaderCircle } from "lucide-react";
import { useRouter } from 'next/navigation'
import { useEffect } from "react";

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            router.push("/");
        }, 1000);
    }, []);

    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <LoaderCircle className="animate-spin text-primary" size="64" />
        </div>
    );
}