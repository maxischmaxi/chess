import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";

const AudioProvider = dynamic(
    () =>
        import("@/components/audio-provider").then((mod) => mod.AudioProvider),
    {
        ssr: !!false,
    },
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
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </AudioProvider>
            </body>
        </html>
    );
}
