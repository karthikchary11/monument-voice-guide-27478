import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2, 
  Eye,
  Globe,
  Upload
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ModelViewer from "@/components/ModelViewer";

interface Monument {
  id: string;
  name: string;
  description: string;
  historical_info: string | null;
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMonument, setEditingMonument] = useState<Monument | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    historical_info: "",
    location: "",
    category: "",
    image_url: "",
    model_url: "",
    audio_english_url: "",
    audio_hindi_url: "",
    audio_telugu_url: ""
  });

  useEffect(() => {
    const guardAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // fetch profile role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        toast({ title: "Access check failed", description: profileError.message, variant: "destructive" });
        navigate("/dashboard");
        return;
      }

      if (!profile || profile.role !== "admin") {
        toast({ title: "Access denied", description: "Admin privileges required" });
        navigate("/dashboard");
        return;
      }

      fetchMonuments();
    };

    guardAndLoad();
  }, [navigate]);

  const fetchMonuments = async () => {
    try {
      const { data, error } = await supabase
        .from("monuments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMonuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading monuments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingMonument(null);
    setFormData({
      name: "",
      description: "",
      historical_info: "",
      location: "",
      category: "",
      image_url: "",
      model_url: "",
      audio_english_url: "",
      audio_hindi_url: "",
      audio_telugu_url: ""
    });
  };

  const handleEdit = (monument: Monument) => {
    setEditingMonument(monument);
    setIsCreating(false);
    setFormData({
      name: monument.name,
      description: monument.description,
      historical_info: monument.historical_info || "",
      location: monument.location,
      category: monument.category || "",
      image_url: monument.image_url || "",
      model_url: monument.model_url || "",
      audio_english_url: monument.audio_english_url || "",
      audio_hindi_url: monument.audio_hindi_url || "",
      audio_telugu_url: monument.audio_telugu_url || ""
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Name, description, and location are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const monumentData = {
        name: formData.name,
        description: formData.description,
        historical_info: formData.historical_info || null,
        location: formData.location,
        category: formData.category || null,
        image_url: formData.image_url || null,
        model_url: formData.model_url || null,
        audio_english_url: formData.audio_english_url || null,
        audio_hindi_url: formData.audio_hindi_url || null,
        audio_telugu_url: formData.audio_telugu_url || null,
        created_by: user.id,
        updated_at: new Date().toISOString()
      };

      if (isCreating) {
        const { error } = await supabase
          .from("monuments")
          .insert([monumentData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Monument created successfully",
        });
      } else if (editingMonument) {
        const { error } = await supabase
          .from("monuments")
          .update(monumentData)
          .eq("id", editingMonument.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Monument updated successfully",
        });
      }

      setEditingMonument(null);
      setIsCreating(false);
      fetchMonuments();
    } catch (error: any) {
      toast({
        title: "Error saving monument",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monument?")) return;

    try {
      const { error } = await supabase
        .from("monuments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Monument deleted successfully",
      });
      
      fetchMonuments();
    } catch (error: any) {
      toast({
        title: "Error deleting monument",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingMonument(null);
    setIsCreating(false);
  };

  const handleView = (id: string) => {
    navigate(`/monument/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage monuments and 3D models</p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Monument
          </Button>
        </div>

        <Tabs defaultValue="monuments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monuments">Monuments</TabsTrigger>
            <TabsTrigger value="models">3D Models</TabsTrigger>
          </TabsList>

          <TabsContent value="monuments" className="space-y-6">
            {isCreating || editingMonument ? (
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>
                    {isCreating ? "Create New Monument" : "Edit Monument"}
                  </CardTitle>
                  <CardDescription>
                    {isCreating 
                      ? "Add a new monument with 3D model URL" 
                      : "Update monument information and 3D model URL"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Monument name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, State"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the monument"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="historical_info">Historical Information</Label>
                    <Textarea
                      id="historical_info"
                      value={formData.historical_info}
                      onChange={(e) => setFormData({ ...formData, historical_info: e.target.value })}
                      placeholder="Historical background and significance"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monument">Monument</SelectItem>
                          <SelectItem value="Fort">Fort</SelectItem>
                          <SelectItem value="Temple">Temple</SelectItem>
                          <SelectItem value="Palace">Palace</SelectItem>
                          <SelectItem value="Museum">Museum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model_url" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      3D Model URL (Sketchfab Embed URL) *
                    </Label>
                    <Input
                      id="model_url"
                      value={formData.model_url}
                      onChange={(e) => setFormData({ ...formData, model_url: e.target.value })}
                      placeholder="https://sketchfab.com/models/[model-id]/embed?autostart=1&internal=1&tracking=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_watermark=0"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the Sketchfab embed URL for the 3D model. This will replace the need for large GLB files.
                    </p>
                  </div>

                  {formData.model_url && (
                    <div className="space-y-2">
                      <Label>3D Model Preview</Label>
                      <div className="h-64 border rounded-lg overflow-hidden">
                        <ModelViewer
                          src={formData.model_url}
                          alt="3D Model Preview"
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="audio_english_url">English Audio URL</Label>
                      <Input
                        id="audio_english_url"
                        value={formData.audio_english_url}
                        onChange={(e) => setFormData({ ...formData, audio_english_url: e.target.value })}
                        placeholder="https://example.com/audio-en.mp3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="audio_hindi_url">Hindi Audio URL</Label>
                      <Input
                        id="audio_hindi_url"
                        value={formData.audio_hindi_url}
                        onChange={(e) => setFormData({ ...formData, audio_hindi_url: e.target.value })}
                        placeholder="https://example.com/audio-hi.mp3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="audio_telugu_url">Telugu Audio URL</Label>
                      <Input
                        id="audio_telugu_url"
                        value={formData.audio_telugu_url}
                        onChange={(e) => setFormData({ ...formData, audio_telugu_url: e.target.value })}
                        placeholder="https://example.com/audio-te.mp3"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isCreating ? "Create Monument" : "Update Monument"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {monuments.map((monument) => (
                  <Card key={monument.id} className="shadow-elegant">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {monument.name}
                            {monument.model_url && (
                              <Badge variant="secondary" className="gap-1">
                                <Globe className="w-3 h-3" />
                                3D Model
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span>{monument.location}</span>
                            {monument.category && (
                              <>
                                <span>•</span>
                                <Badge variant="outline">{monument.category}</Badge>
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(monument.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(monument)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(monument.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{monument.description}</p>
                      {monument.model_url && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">3D Model URL:</Label>
                          <p className="text-sm text-muted-foreground break-all">
                            {monument.model_url}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  3D Model Management
                </CardTitle>
                <CardDescription>
                  Manage 3D models using Sketchfab embed URLs instead of large GLB files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold mb-2">Benefits of URL-based 3D Models:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Reduced frontend bundle size</li>
                      <li>• Faster loading times</li>
                      <li>• Better performance on mobile devices</li>
                      <li>• Easy model updates without redeployment</li>
                      <li>• Professional 3D model hosting via Sketchfab</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">How to get Sketchfab Embed URL:</h3>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      <li>1. Go to <a href="https://sketchfab.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sketchfab.com</a></li>
                      <li>2. Find or upload your 3D model</li>
                      <li>3. Click on the "Embed" button</li>
                      <li>4. Copy the embed URL</li>
                      <li>5. Add parameters: <code className="bg-muted px-1 rounded">?autostart=1&internal=1&tracking=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_watermark=0</code></li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
