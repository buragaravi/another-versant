import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, ChevronDown, BookOpen, Users, Award, Phone, LogIn, Mail, MapPin, Clock, Star, CheckCircle, ArrowRight } from 'lucide-react'

const GetStarted = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  const features = [
    {
      icon: '🎧',
      title: 'Listening Comprehension',
      description: 'Master real-world audio scenarios with interactive listening tests',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '🗣️',
      title: 'Speaking & Pronunciation',
      description: 'Perfect your accent and fluency with AI-powered speech analysis',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '📖',
      title: 'Reading Comprehension',
      description: 'Enhance reading skills with diverse texts and critical analysis',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '✍️',
      title: 'Writing Excellence',
      description: 'Develop advanced writing skills with structured feedback',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: '📚',
      title: 'Grammar Mastery',
      description: 'Master English grammar rules with interactive exercises',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: '📝',
      title: 'Vocabulary Building',
      description: 'Expand your lexicon with contextual learning and word games',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: '🧠',
      title: 'CRT Reasoning',
      description: 'Develop critical thinking and logical reasoning skills',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: '💻',
      title: 'Programming Logic',
      description: 'Learn coding fundamentals and problem-solving techniques',
      color: 'from-pink-500 to-pink-600'
    }
  ]

  const benefits = [
    'Real-time performance tracking and analytics',
    'Personalized learning paths based on your progress',
    'Interactive practice modules with instant feedback',
    'Comprehensive test history and detailed reports',
    'Mobile-responsive design for learning anywhere',
    'Expert-curated content by language specialists'
  ]

  const navigationItems = [
    { name: 'Home', href: '#home', icon: null },
    { 
      name: 'Features', 
      href: '#features', 
      icon: ChevronDown,
      dropdown: [
        { name: 'Language Skills', href: '#language-skills' },
        { name: 'Technical Skills', href: '#technical-skills' },
        { name: 'Practice Modules', href: '#practice-modules' },
        { name: 'Online Exams', href: '#online-exams' }
      ]
    },
    { name: 'About', href: '#about', icon: null }
  ]

  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index)
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
      {/* Enhanced Background Animations */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] right-[10%] w-[30vw] h-[30vw] bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[20%] left-[20%] w-[25vw] h-[25vw] bg-yellow-100 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-1000"></div>
      </div>

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-200/60 shadow-2xl">
        <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-16 md:h-24">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center"
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm md:text-xl">SE</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Study Edge
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">Education & Beyond</p>
                </div>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              {navigationItems.map((item, index) => (
                <div key={item.name} className="relative group">
                  {item.dropdown ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(index)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold text-lg py-2 px-4 rounded-lg hover:bg-blue-50"
                      >
                        <span>{item.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === index ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === index && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50"
                        >
                          {item.dropdown.map((dropdownItem) => (
                            <a
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className="block px-6 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 font-medium"
                            >
                              {dropdownItem.name}
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(item.href.substring(1))
                      }}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-semibold text-lg py-2 px-4 rounded-lg hover:bg-blue-50"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.name}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden md:block"
            >
              <Link
                to="/login"
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-lg group"
              >
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Login</span>
              </Link>
            </motion.div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-3"
            >
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(item.href.substring(1))
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors text-sm font-semibold py-2 px-3 rounded-lg hover:bg-blue-50"
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.name}</span>
                  </a>
                ))}
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* Main Content with proper spacing for fixed header */}
      <div className="pt-16 md:pt-24">
        {/* Hero Section */}
        <section id="home" className="w-full min-h-screen flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8"
              >
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Study Edge
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-700 mb-3 md:mb-4 lg:mb-6 max-w-4xl lg:max-w-5xl mx-auto leading-relaxed"
              >
                The ultimate comprehensive learning platform designed to transform your{' '}
                <span className="font-bold text-blue-600">English language skills</span> and{' '}
                <span className="font-bold text-purple-600">cognitive abilities</span>
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 lg:mb-16 max-w-3xl lg:max-w-4xl mx-auto"
              >
                From foundational grammar to advanced programming logic, Study Edge offers an immersive learning experience that adapts to your pace and goals.
              </motion.p>

              {/* Urgency Message */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 sm:p-6 md:p-8 lg:p-10 rounded-xl md:rounded-2xl lg:rounded-3xl mb-6 md:mb-8 lg:mb-16 max-w-4xl lg:max-w-5xl mx-auto shadow-lg md:shadow-xl lg:shadow-2xl"
              >
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 lg:mb-4">🚀 Ready to Transform Your Skills?</h3>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                  Join thousands of students already mastering English and critical thinking. 
                  <span className="font-bold"> Login now to unlock your personalized learning journey!</span>
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-8 justify-center mb-8 md:mb-12 lg:mb-16"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 md:py-5 lg:py-6 text-base sm:text-lg md:text-xl lg:text-2xl font-bold rounded-lg md:rounded-xl lg:rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-lg md:shadow-xl lg:shadow-2xl hover:shadow-xl md:hover:shadow-2xl lg:hover:shadow-3xl"
                  >
                    🚀 Start Learning Now
                    <ArrowRight className="ml-2 sm:ml-3 md:ml-4 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-16 lg:py-24 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 md:mb-12 lg:mb-20"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 md:mb-4 lg:mb-8">
                Comprehensive Learning Features
              </h2>
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl lg:max-w-4xl mx-auto">
                Discover our wide range of learning modules designed to enhance every aspect of your skills
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12 lg:mb-20"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 20px 40px 0 rgba(0, 120, 255, 0.15), 0 0 60px 20px #a5b4fc',
                    transition: { duration: 0.3 }
                  }}
                  className="group relative"
                >
                  <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-10 shadow-lg md:shadow-xl lg:shadow-xl hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden h-full">
                    <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 md:mb-4 lg:mb-8 group-hover:scale-110 transition-transform duration-300 text-center`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 md:mb-3 lg:mb-6 group-hover:text-blue-600 transition-colors text-center">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed text-center">
                      {feature.description}
                    </p>
                    {/* Card lighting effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200 rounded-full blur-2xl opacity-40 animate-card-light"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-200 rounded-full blur-2xl opacity-30 animate-card-light animation-delay-2000"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-12 shadow-lg md:shadow-xl lg:shadow-2xl mb-8 md:mb-12 lg:mb-20 w-full"
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-10 text-center">
                Why Choose Study Edge?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-3 md:space-x-4 lg:space-x-6 p-3 md:p-4 lg:p-6 rounded-lg md:rounded-xl lg:rounded-2xl hover:bg-blue-50 transition-all duration-300"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-500 flex-shrink-0" />
                    <span className="text-xs sm:text-base md:text-lg lg:text-xl font-medium text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="w-full py-12 md:py-16 lg:py-24 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-12 shadow-lg md:shadow-xl lg:shadow-2xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8">
                    About Study Edge
                  </h2>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-4 md:mb-6 lg:mb-8 leading-relaxed">
                    Study Edge is a comprehensive learning platform designed to transform how students approach English language learning and cognitive skill development. Our mission is to provide an immersive, adaptive learning experience that caters to individual needs and learning styles.
                  </p>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 md:mb-8 lg:mb-10 leading-relaxed">
                    With cutting-edge technology and expert-curated content, we help students master essential skills from foundational grammar to advanced programming logic, ensuring they're well-prepared for academic and professional success.
                  </p>
                  <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-10">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-1 md:mb-2 lg:mb-3">5+</div>
                      <div className="text-gray-600 text-xs sm:text-base md:text-lg lg:text-xl font-semibold">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-purple-600 mb-1 md:mb-2 lg:mb-3">100+</div>
                      <div className="text-gray-600 text-xs sm:text-base md:text-lg lg:text-xl font-semibold">Expert Instructors</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl md:rounded-2xl lg:rounded-3xl p-6 md:p-8 lg:p-12 text-white">
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 lg:mb-8">Our Mission</h3>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 md:mb-8 lg:mb-10 leading-relaxed">
                      To empower learners worldwide with comprehensive, adaptive learning experiences that transform their English language skills and cognitive abilities, preparing them for success in an increasingly globalized world.
                    </p>
                    <div className="space-y-3 md:space-y-4 lg:space-y-8">
                      <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-6">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-400" />
                        <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold">Personalized Learning Paths</span>
                      </div>
                      <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-6">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-400" />
                        <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold">Expert-Curated Content</span>
                      </div>
                      <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-6">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-400" />
                        <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold">Real-time Progress Tracking</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-gray-900 text-white py-8 md:py-12 lg:py-16 mt-12 md:mt-16 lg:mt-24">
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center space-x-2 md:space-x-4 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm md:text-xl">SE</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-lg md:text-2xl font-bold text-white">Study Edge</h1>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">Education & Beyond</p>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-lg leading-relaxed">
                  Empowering minds through comprehensive learning experiences that transform English language skills and cognitive abilities.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h4 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 md:mb-4 lg:mb-6">Quick Links</h4>
                <ul className="space-y-2 md:space-y-3 lg:space-y-4">
                  <li><a href="#home" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">Home</a></li>
                  <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">Features</a></li>
                  <li><a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">About</a></li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h4 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 md:mb-4 lg:mb-6">Learning Modules</h4>
                <ul className="space-y-2 md:space-y-3 lg:space-y-4">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">Language Skills</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">Technical Skills</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">Practice Modules</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm md:text-lg font-medium">Online Exams</a></li>
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="border-t border-gray-800 mt-6 md:mt-8 lg:mt-12 pt-4 md:pt-6 lg:pt-8 text-center"
            >
              <p className="text-gray-400 text-sm md:text-lg lg:text-xl">
                © 2025 Study Edge. All rights reserved. | Empowering minds through comprehensive learning.
              </p>
            </motion.div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes card-light {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .animate-card-light {
          animation: card-light 3s infinite alternate;
        }
      `}</style>
    </div>
  )
}

export default GetStarted 