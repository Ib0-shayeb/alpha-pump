import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {title && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <Navigation />
    </div>
  );
};