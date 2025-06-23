
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const GoogleCalendarEmbed = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Agenda Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden rounded-lg border">
          <iframe 
            src="https://calendar.google.com/calendar/embed?src=fb2b1dfb1e6c600594b05785de5cf04fb38bd0376bd3f5e5d1c08c60d4c894df%40group.calendar.google.com&ctz=America%2FSao_Paulo" 
            style={{ border: 0 }} 
            width="100%" 
            height="600" 
            frameBorder="0" 
            scrolling="no"
            title="Google Calendar"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarEmbed;
