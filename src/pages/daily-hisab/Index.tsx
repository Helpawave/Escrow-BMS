import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Calculator,
      title: "Financial Calculations",
      description: "Track your per day hisab with automatic hisab calculation",
    },
    {
      icon: TrendingUp,
      title: "History Tracking",
      description:
        "Complete timeline of all calculations with trends and analytics",
    },
    {
      icon: Users,
      title: "User Management",
      description: "Secure authentication with admin approval system",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="ESCOCALC" className="w-8 h-8" />
              <span className="text-xl font-bold">ESCOCALC</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-primary hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16 animate-fade-in">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-4">
              Professional Financial Tracking System
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Track Your Financial Calculations with Precision
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive system for tracking daily financial calculations,
              managing user access, and maintaining complete calculation history
              with admin oversight.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 px-8"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Start Calculating
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-sm text-muted-foreground">
            ✨ Secure • Professional • Easy to Use
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full px-6 lg:px-12 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 gap-y-10 mb-10">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="shadow-card hover:shadow-xl hover:scale-[1.03] transition-transform duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-8 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center space-y-12 animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Simple, secure, and efficient financial tracking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 rounded-md shadow-card hover:shadow-xl hover:scale-[1.02] transition-transform duration-300 animate-fade-in p-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold">
                Create Account & Get Approved
              </h3>
              <p className="text-muted-foreground">
                Sign up with email or Google, then wait for admin approval to
                access the system
              </p>
            </div>

            <div className="space-y-4 rounded-md shadow-card hover:shadow-xl hover:scale-[1.02] transition-transform duration-300 animate-fade-in p-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold">Enter Your Values</h3>
              <p className="text-muted-foreground">
                Input your daily stuff values for automatic calculation of
                today's hisab
              </p>
            </div>

            <div className="space-y-4 rounded-md shadow-card hover:shadow-xl hover:scale-[1.02] transition-transform duration-300 animate-fade-in p-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold">Track & Analyze</h3>
              <p className="text-muted-foreground">
                View your complete history, trends, and differences between
                calculations over time
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="max-w-2xl mx-auto mt-16 animate-fade-in">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Get Started Today
              </h3>
              <div className="space-y-4 text-sm">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="font-medium text-primary mb-2">
                    Ready to Track Your Finances?
                  </div>
                  <p className="text-muted-foreground">
                    Create your account and start managing your daily
                    calculations with our secure, cloud-based platform. Admin
                    approval required for access.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/signup">
                    <Button className="bg-gradient-primary hover:opacity-90">
                      Create Account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
