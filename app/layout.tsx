import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import { AudioProvider } from "@/components/audio-provider";

const ImagesProvider = dynamic(() =>
    import("@/components/images-provider").then((mod) => mod.ImagesProvider),
);

const ThemeProvider = dynamic(() =>
    import("@/components/theme-provider").then((mod) => mod.ThemeProvider),
);

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Max's Chess Game",
    description: "A chess game made by Max",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <AudioProvider>
                    <ImagesProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            {children}
                        </ThemeProvider>
                    </ImagesProvider>
                </AudioProvider>
            </body>
        </html>
    );
}
