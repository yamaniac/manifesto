import { CheckCircle, Clock, Target, Heart, Brain, Dumbbell } from 'lucide-react';

const templates = [
  {
    icon: Clock,
    title: "Morning Routine",
    description: "Start your day with purpose and energy",
    color: "blue",
    features: ["Wake up early", "Meditation", "Exercise", "Healthy breakfast"]
  },
  {
    icon: Target,
    title: "Goal Achievement",
    description: "Break down big goals into manageable steps",
    color: "purple",
    features: ["SMART goals", "Milestone tracking", "Progress reviews", "Celebration"]
  },
  {
    icon: Heart,
    title: "Wellness Journey",
    description: "Focus on mental and physical health",
    color: "pink",
    features: ["Self-care", "Gratitude practice", "Sleep tracking", "Stress management"]
  },
  {
    icon: Brain,
    title: "Learning & Growth",
    description: "Develop new skills and knowledge",
    color: "green",
    features: ["Daily reading", "Skill practice", "Reflection", "Knowledge sharing"]
  },
  {
    icon: Dumbbell,
    title: "Fitness Challenge",
    description: "Build strength and endurance",
    color: "orange",
    features: ["Workout plans", "Nutrition tracking", "Progress photos", "Community support"]
  }
];

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600"
};

export default function Templates() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ready-Made Templates
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Jumpstart your journey with professionally designed templates that have helped thousands of users achieve their goals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Templates List */}
          <div className="space-y-6">
            {templates.map((template, index) => {
              const IconComponent = template.icon;
              return (
                <div key={index} className="bg-slate-50 rounded-2xl p-6 hover:bg-slate-100 transition-colors duration-300 cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${colorClasses[template.color]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{template.title}</h3>
                      <p className="text-slate-600 mb-3">{template.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {template.features.map((feature, featureIndex) => (
                          <span key={featureIndex} className="inline-flex items-center text-xs bg-white text-slate-600 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column - Mobile Screen Preview */}
          <div className="flex justify-center lg:justify-start">
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

                  {/* App Content - Templates Screen */}
                  <div className="p-6 h-full bg-gradient-to-br from-purple-50 to-pink-100">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Templates</h2>
                        <p className="text-slate-600 text-sm">Choose your journey</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">T</span>
                      </div>
                    </div>

                    {/* Template Cards */}
                    <div className="space-y-3 mb-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">Morning Routine</div>
                            <div className="text-xs text-slate-500">4 habits • 30 days</div>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Popular</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">Goal Achievement</div>
                            <div className="text-xs text-slate-500">6 habits • 90 days</div>
                          </div>
                          <div className="text-xs text-purple-600 font-medium">New</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-pink-500">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-4 h-4 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">Wellness Journey</div>
                            <div className="text-xs text-slate-500">5 habits • 60 days</div>
                          </div>
                          <div className="text-xs text-pink-600 font-medium">Trending</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Brain className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">Learning & Growth</div>
                            <div className="text-xs text-slate-500">7 habits • 45 days</div>
                          </div>
                          <div className="text-xs text-green-600 font-medium">Featured</div>
                        </div>
                      </div>
                    </div>

                    {/* Custom Template Option */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">+</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Create Custom Template</div>
                          <div className="text-xs text-white/80">Build your own journey</div>
                        </div>
                        <div className="text-xs bg-white/20 px-2 py-1 rounded-full">Free</div>
                      </div>
                    </div>

                    {/* Bottom Navigation Placeholder */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
                      <div className="flex justify-around">
                        {['Home', 'Templates', 'Goals', 'Profile'].map((item, index) => (
                          <div key={item} className="flex flex-col items-center space-y-1">
                            <div className={`w-6 h-6 rounded-lg ${index === 1 ? 'bg-purple-500' : 'bg-slate-300'}`}></div>
                            <span className={`text-xs ${index === 1 ? 'text-purple-600 font-medium' : 'text-slate-500'}`}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Choose from our library of proven templates or create your own custom journey. 
              Join thousands of users who are already achieving their goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                Browse Templates
              </button>
              <button className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 px-8 py-3 rounded-xl font-medium transition-colors duration-200">
                Create Custom
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


