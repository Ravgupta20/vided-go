import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const TOOLS = [
  {
    to: '/filters',
    name: 'Filter Preview',
    description: 'Real-time canvas video filter preview with AI-generated variants',
  },
  {
    to: '/marker',
    name: 'Audio Marker',
    description: 'Time images to an audio track and export a slideshow timeline',
  },
  {
    to: '/crop',
    name: 'Image Cropper',
    description: 'Crop images for use as slides/overlays',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center gap-8 p-10">
      <h1 className="text-2xl font-bold font-heading">vided-go tools</h1>
      <div className="grid gap-4 w-full max-w-3xl sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to}>
            <Card className="h-full hover:ring-primary/50 transition-colors">
              <CardHeader>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
