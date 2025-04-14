
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
              Central de Viagens
            </div>
            <div>
              {user ? (
                <Link to="/points">
                  <Button variant="outline" className="bg-white text-travel-blue hover:bg-gray-100">
                    Meu Painel
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="bg-white text-travel-blue hover:bg-gray-100">
                    Entrar
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
              <h1 className="text-5xl font-bold text-travel-dark mb-6">Acompanhe suas Aventuras de Viagem</h1>
              <p className="text-xl text-travel-dark/80 mb-10">
                Mantenha todos os seus destinos favoritos organizados em um só lugar. Planeje viagens, salve memórias e nunca mais esqueça aquele lugar especial que você descobriu.
              </p>
              {user ? (
                <Link to="/points">
                  <Button size="lg" className="bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark text-lg px-8 py-6">
                    Ir para Meus Pontos
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="bg-travel-mustard hover:bg-travel-mustard/90 text-travel-dark text-lg px-8 py-6">
                    Começar Agora
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-travel-dark text-center mb-12">Funcionalidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-travel-light-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-travel-dark mb-2">Salve Pontos de Interesse</h3>
                <p className="text-travel-dark/70">Acompanhe todos os lugares que você deseja visitar ou já visitou. Adicione notas e categorize-os para referência fácil.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-travel-light-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-travel-dark mb-2">Crie Checklists</h3>
                <p className="text-travel-dark/70">Faça checklists para suas viagens para garantir que você não esqueça nada importante. Marque os itens à medida que os completa.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-travel-light-blue rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-travel-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-travel-dark mb-2">Acompanhe Seu Progresso</h3>
                <p className="text-travel-dark/70">Veja estatísticas sobre suas viagens e acompanhe seu progresso enquanto explora novos destinos ao redor do mundo.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-travel-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="mb-2">Travel Hub - Seu Companheiro Pessoal de Viagens</p>
            <p className="text-white/60 text-sm">© {new Date().getFullYear()} Travel Hub. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
