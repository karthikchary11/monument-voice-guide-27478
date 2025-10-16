import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Hotel, Navigation as NavigationIcon, Volume2, Star, Loader2, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ModelViewer from "@/components/ModelViewer";

interface Monument {
  id: string;
  name: string;
  description: string;
  description_english: string | null;
  description_hindi: string | null;
  description_telugu: string | null;
  historical_info: string | null;
  historical_info_english: string | null;
  historical_info_hindi: string | null;
  historical_info_telugu: string | null;
  location: string;
  category: string | null;
  image_url: string | null;
  model_url: string | null;
  audio_english_url: string | null;
  audio_hindi_url: string | null;
  audio_telugu_url: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

interface Recommendation {
  id: string;
  type: string;
  name: string;
  description: string | null;
  distance: string | null;
  rating: number | null;
  contact: string | null;
}

const MonumentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [monument, setMonument] = useState<Monument | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [audioText, setAudioText] = useState<{ [key: string]: string }>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      fetchMonumentDetails();
    };
    checkAuth();
  }, [id, navigate]);

  const fetchMonumentDetails = async () => {
    try {
      const [monumentRes, recommendationsRes] = await Promise.all([
        supabase.from("monuments").select("*").eq("id", id).single(),
        supabase.from("recommendations").select("*").eq("monument_id", id),
      ]);
      if (monumentRes.error) throw monumentRes.error;
      if (recommendationsRes.error) throw recommendationsRes.error;

      setMonument(monumentRes.data as Monument);
      setRecommendations(recommendationsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading monument details",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getDescriptionByLanguage = (lang: string) => {
    switch (lang) {
      case "hindi":
        return monument?.description_hindi || monument?.description || "";
      case "telugu":
        return monument?.description_telugu || monument?.description || "";
      default:
        return monument?.description_english || monument?.description || "";
    }
  };

  const getHistoricalInfoByLanguage = (lang: string) => {
    switch (lang) {
      case "hindi":
        return monument?.historical_info_hindi || monument?.historical_info || "";
      case "telugu":
        return monument?.historical_info_telugu || monument?.historical_info || "";
      default:
        return monument?.historical_info_english || monument?.historical_info || "";
    }
  };

  const handleAudioPlayback = async (language: string) => {
    if (!monument) return;
    setAudioLoading(language);
    try {
      let audioUrl: string | null = null;
      switch (language) {
        case "english":
          audioUrl = monument.audio_english_url;
          break;
        case "hindi":
          audioUrl = monument.audio_hindi_url;
          break;
        case "telugu":
          audioUrl = monument.audio_telugu_url;
          break;
      }

      if (audioUrl) {
        // Play pre-recorded audio
        const audio = new Audio(audioUrl);
        await audio.play();
        setAudioText((prev) => ({ ...prev, [language]: "Playing pre-recorded audio." }));
        toast({
          title: "Audio started",
          description: `Playing pre-recorded audio in ${language.charAt(0).toUpperCase() + language.slice(1)}`,
        });
      } else {
        // Fallback to TTS
        const description = getDescriptionByLanguage(language);
        const historicalInfo = getHistoricalInfoByLanguage(language);
        let textToSpeak = description;
        if (historicalInfo) {
          textToSpeak += `. ${historicalInfo}`;
        }

        if (!textToSpeak) {
          throw new Error("No content available for audio generation.");
        }

        const { data, error } = await supabase.functions.invoke("text-to-speech", {
          body: { text: textToSpeak, language },
        });
        if (error) throw error;

        setAudioText((prev) => ({ ...prev, [language]: data.translatedText }));

        const utterance = new SpeechSynthesisUtterance(data.translatedText);
        utterance.lang = language === "telugu" ? "te-IN" : language === "hindi" ? "hi-IN" : "en-US";
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
        toast({
          title: "Audio started",
          description: `Playing generated audio in ${language.charAt(0).toUpperCase() + language.slice(1)}`,
        });
      }
    } catch (error: any) {
      console.error("Audio error:", error);
      toast({
        title: "Error with audio",
        description: error.message || "Failed to play audio",
        variant: "destructive",
      });
    } finally {
      setAudioLoading(null);
    }
  };

  if (loading || !monument) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const nearbyPlaces = recommendations.filter((r) => r.type === "nearby_place");
  const hotels = recommendations.filter((r) => r.type === "hotel");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden shadow-elegant">
              <div className="relative h-96">
                {monument.model_url ? (
                  <ModelViewer
                    src={monument.model_url}
                    alt={monument.name}
                    className="w-full h-full"
                  />
                ) : monument.image_url ? (
                  <img
                    src={monument.image_url}
                    alt={monument.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">No media available</p>
                  </div>
                )}
                {monument.category && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground shadow-soft">
                    {monument.category}
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">{monument.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4" />
                  {monument.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{getDescriptionByLanguage(selectedLanguage)}</p>
                </div>
                {getHistoricalInfoByLanguage(selectedLanguage) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Historical Information</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{getHistoricalInfoByLanguage(selectedLanguage)}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Audio Guide</h3>
                  <div className="space-y-4">
                    <Button
                      onClick={() => handleAudioPlayback(selectedLanguage)}
                      disabled={audioLoading !== null}
                      className="gap-2 bg-secondary hover:bg-secondary/90"
                    >
                      {audioLoading === selectedLanguage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      Play Audio in {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
                    </Button>
                    {audioText[selectedLanguage] && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <h4 className="text-sm font-medium mb-2">
                          Audio Content ({selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}):
                        </h4>
                        <p className="text-sm text-muted-foreground">{audioText[selectedLanguage]}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Nearby attractions and hotels</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="places" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="places" className="flex-1">
                      <NavigationIcon className="w-4 h-4 mr-2" />
                      Places
                    </TabsTrigger>
                    <TabsTrigger value="hotels" className="flex-1">
                      <Hotel className="w-4 h-4 mr-2" />
                      Hotels
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="places" className="space-y-4 mt-4">
                    {nearbyPlaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No nearby places available
                      </p>
                    ) : (
                      nearbyPlaces.map((place) => (
                        <Card key={place.id} className="border-l-4 border-l-secondary">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{place.name}</CardTitle>
                            {place.distance && (
                              <CardDescription className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {place.distance}
                              </CardDescription>
                            )}
                          </CardHeader>
                          {place.description && (
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground">{place.description}</p>
                              {place.rating && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Star className="w-4 h-4 fill-primary text-primary" />
                                  <span className="text-sm font-medium">{place.rating}</span>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="hotels" className="space-y-4 mt-4">
                    {hotels.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hotels available
                      </p>
                    ) : (
                      hotels.map((hotel) => (
                        <Card key={hotel.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{hotel.name}</CardTitle>
                            {hotel.distance && (
                              <CardDescription className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {hotel.distance}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            {hotel.description && (
                              <p className="text-sm text-muted-foreground mb-2">{hotel.description}</p>
                            )}
                            {hotel.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-primary text-primary" />
                                <span className="text-sm font-medium">{hotel.rating}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MonumentDetails;
