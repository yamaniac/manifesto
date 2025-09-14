'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Smartphone } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Manifesto
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              Features
            </a>
            <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              About
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              Pricing
            </a>
            <a href="#contact" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              Contact
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-600" />
            ) : (
              <Menu className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/60">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors font-medium py-2">
                Features
              </a>
              <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors font-medium py-2">
                About
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors font-medium py-2">
                Pricing
              </a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900 transition-colors font-medium py-2">
                Contact
              </a>
              <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200/60">
                <Button variant="ghost" className="justify-start text-slate-600 hover:text-slate-900">
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}


