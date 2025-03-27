
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { Plane } from 'lucide-react';

const Index: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-travel-blue py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-white font-bold text-2xl">
              <Plane className="h-6 w-6 mr-2" />
              Travel Hub
            </div>
            <div>
              {user ? (
                <Link to="/points">
                  <Button variant="outline" className="bg-white text-travel-blue hover:bg-gray-100">
                    My Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="bg-white text-travel-blue hover:bg-gray-100">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 bg-travel-beige">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold text-travel-dark mb-6">Track Your Travel Adventures</h1>
              <p className="text-xl text-travel-dark/80 mb-10">
                Keep all your favorite destinations organized in one place. Plan trips, save memories, and never forget that hidden gem you discovered.
              </p>
              {user ? (
                <Link to="/points">
                  <Button size="lg" className="bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark text-lg px-8 py-6">
                    Go to My Points
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark text-lg px-8 py-6">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-travel-dark text-center mb-12">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-travel-light-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-travel-dark mb-2">Save Points of Interest</h3>
                <p className="text-travel-dark/70">Keep track of all the places you want to visit or have visited. Add notes and categorize them for easy reference.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-travel-light-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-travel-dark mb-2">Create Checklists</h3>
                <p className="text-travel-dark/70">Make checklists for your trips to ensure you don't forget anything important. Check items off as you complete them.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-travel-light-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-travel-dark mb-2">Track Your Progress</h3>
                <p className="text-travel-dark/70">See statistics about your travels and track your progress as you explore new destinations around the world.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-travel-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="mb-2">Travel Hub - Your Personal Travel Companion</p>
            <p className="text-white/60 text-sm">© {new Date().getFullYear()} Travel Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
