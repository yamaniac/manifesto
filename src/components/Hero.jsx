import { Button } from '@/components/ui/button';
import { Download, Star, Zap, Users, Shield } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Transform Your Life with
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Manifesto
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              The ultimate mobile app for personal growth, habit tracking, and achieving your goals. 
              Join thousands of users who are already living their best lives.
            </p>
            
            {/* App Store Badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-4 h-auto">
                <Download className="w-5 h-5 mr-2" />
                Download for iOS
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-slate-300 hover:border-slate-400 px-8 py-4 h-auto">
                <Download className="w-5 h-5 mr-2" />
                Download for Android
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-slate-600 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-purple-600 mb-2">4.9</div>
                <div className="text-slate-600 text-sm flex items-center justify-center">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                  Rating
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-2">1M+</div>
                <div className="text-slate-600 text-sm">Goals</div>
              </div>
            </div>
          </div>

          {/* Right Column - Mobile App Preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative w-72 h-[580px] bg-slate-900 rounded-[3rem] p-2 shadow-2xl">
                {/* Screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">9:41</div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-slate-900 rounded-sm"></div>
                      <div className="w-6 h-3 border border-slate-900 rounded-sm">
                        <div className="w-4 h-2 bg-slate-900 rounded-sm m-0.5"></div>
                      </div>
                    </div>
                  </div>

                  {/* App Content Placeholder */}
                  <div className="p-6 h-full bg-gradient-to-br from-blue-50 to-indigo-100">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Good Morning!</h2>
                        <p className="text-slate-600 text-sm">Ready to achieve your goals?</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">M</span>
                      </div>
                    </div>

                    {/* Progress Cards */}
                    <div className="space-y-4 mb-6">
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Daily Habits</span>
                          <span className="text-xs text-slate-500">3/5</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{width: '60%'}}></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Weekly Goals</span>
                          <span className="text-xs text-slate-500">2/3</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '67%'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">Morning Routine</div>
                          <div className="text-xs text-slate-500">Complete your daily habits</div>
                        </div>
                        <div className="w-6 h-6 border-2 border-slate-300 rounded-full"></div>
                      </div>

                      <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">Community</div>
                          <div className="text-xs text-slate-500">Connect with others</div>
                        </div>
                        <div className="w-6 h-6 border-2 border-slate-300 rounded-full"></div>
                      </div>

                      <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">Progress</div>
                          <div className="text-xs text-slate-500">Track your journey</div>
                        </div>
                        <div className="w-6 h-6 border-2 border-slate-300 rounded-full"></div>
                      </div>
                    </div>

                    {/* Bottom Navigation Placeholder */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
                      <div className="flex justify-around">
                        {['Home', 'Habits', 'Goals', 'Profile'].map((item, index) => (
                          <div key={item} className="flex flex-col items-center space-y-1">
                            <div className={`w-6 h-6 rounded-lg ${index === 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                            <span className={`text-xs ${index === 0 ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Star className="w-8 h-8 text-white fill-current" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


