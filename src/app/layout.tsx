import type { Metadata } from "next";
import "./globals.css";
import "./stage.css";
import { FirebaseProvider } from '@/lib/useFirebase';
import { ProjectProvider } from '@/lib/useProjectStore';

export const metadata: Metadata = {
    title: "IN-TE-REAL | Interior Innovation in Real-time",
    description: "AI-orchestrated interior design pipeline. Cloud Dancer edition.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                {/* Ambient background art */}
                <div className="bg-art">
                    <div className="bg-orb bg-orb-1" />
                    <div className="bg-orb bg-orb-2" />
                    <div className="bg-orb bg-orb-3" />
                    <div className="bg-orb bg-orb-4" />
                </div>
                <FirebaseProvider>
                    <ProjectProvider>
                        {children}
                    </ProjectProvider>
                </FirebaseProvider>
            </body>
        </html>
    );
}
