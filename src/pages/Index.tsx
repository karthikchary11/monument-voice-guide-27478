import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, MapPin, Globe, Volume2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  const translations = {
    english: {
      title: "Smart Tourism Guide",
      subtitle: "Explore India's rich cultural heritage with interactive AR guides, multi-language audio tours, and personalized recommendations",
      getStarted: "Get Started",
      signIn: "Sign In",
      discoverMonuments: "Discover Monuments",
      discoverDescription: "Explore monument images and get instant historical information and cultural insights",
      multiLanguageAudio: "Multi-Language Audio",
      multiLanguageDescription: "Listen to guided tours in Telugu, Hindi, and English with natural narration",
      smartRecommendations: "Smart Recommendations",
      smartRecommendationsDescription: "Get personalized suggestions for nearby attractions, hotels, and travel tips"
    },
    telugu: {
      title: "స్మార్ట్ టూరిజం గైడ్",
      subtitle: "ఇంటరాక్టివ్ AR గైడ్‌లు, మల్టీ-లాంగ్వేజ్ ఆడియో టూర్‌లు మరియు వ్యక్తిగత సిఫార్సులతో ఇండియా యొక్క సంపన్న సాంస్కృతిక వారసత్వాన్ని అన్వేషించండి",
      getStarted: "ప్రారంభించు",
      signIn: "సైన్ ఇన్",
      discoverMonuments: "స్మారకాలను కనుగొనండి",
      discoverDescription: "స్మారక చిత్రాలను అన్వేషించి తక్షణ హిస్టారికల్ సమాచారం మరియు సాంస్కృతిక అంతర్దృష్టులను పొందండి",
      multiLanguageAudio: "మల్టీ-లాంగ్వేజ్ ఆడియో",
      multiLanguageDescription: "టెలుగు, హిందీ మరియు ఇంగ్లీష్‌లో గైడెడ్ టూర్‌లకు వినండి సహజ వివరణతో",
      smartRecommendations: "స్మార్ట్ సిఫార్సులు",
      smartRecommendationsDescription: "సమీప అట్రాక్షన్‌లు, హోటల్స్ మరియు ట్రావెల్ టిప్స్ కోసం వ్యక్తిగత సూచనలను పొందండి"
    },
    hindi: {
      title: "स्मार्ट टूरिज्म गाइड",
      subtitle: "इंटरएक्टिव AR गाइड, मल्टी-लैंग्वेज ऑडियो टूर और व्यक्तिगत सिफारिशों के साथ भारत की समृद्ध सांस्कृतिक विरासत का अन्वेषण करें",
      getStarted: "शुरू करें",
      signIn: "साइन इन",
      discoverMonuments: "स्मारक खोजें",
      discoverDescription: "स्मारक छवियों का अन्वेषण करें और तत्काल ऐतिहासिक जानकारी और सांस्कृतिक अंतर्दृष्टि प्राप्त करें",
      multiLanguageAudio: "मल्टी-लैंग्वेज ऑडियो",
      multiLanguageDescription: "तेलुगु, हिंदी और अंग्रेजी में गाइडेड टूर सुनें प्राकृतिक वर्णन के साथ",
      smartRecommendations: "स्मार्ट सिफारिशें",
      smartRecommendationsDescription: "नजदीकी आकर्षणों, होटलों और यात्रा युक्तियों के लिए व्यक्तिगत सुझाव प्राप्त करें"
    }
  };

  const currentTranslation = translations[selectedLanguage as keyof typeof translations];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 mb-16">
          <div className="flex justify-center mb-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="telugu">తెలుగు</SelectItem>
                <SelectItem value="hindi">हिंदी</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <div className="p-6 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-elegant">
              <Landmark className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            {currentTranslation.title}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {currentTranslation.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-elegant text-lg px-8"
            >
              {currentTranslation.getStarted}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-2 border-primary/50 hover:bg-primary/5 text-lg px-8"
            >
              {currentTranslation.signIn}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-2 border-primary/10 shadow-soft hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">{currentTranslation.discoverMonuments}</h3>
              <p className="text-muted-foreground">
                {currentTranslation.discoverDescription}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/10 shadow-soft hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-secondary/10 rounded-2xl">
                  <Volume2 className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">{currentTranslation.multiLanguageAudio}</h3>
              <p className="text-muted-foreground">
                {currentTranslation.multiLanguageDescription}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 shadow-soft hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">{currentTranslation.smartRecommendations}</h3>
              <p className="text-muted-foreground">
                {currentTranslation.smartRecommendationsDescription}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
