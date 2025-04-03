
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TimeRange {
  open: string;
  close: string;
}

interface DaySchedule {
  isOpen: boolean;
  timeRanges: TimeRange[];
}

type WeekSchedule = {
  [key in WeekDay]: DaySchedule;
};

type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS_OF_WEEK: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_TIME_RANGE: TimeRange = { open: '09:00', close: '17:00' };

interface OpeningHoursInputProps {
  value: string;
  onChange: (value: string) => void;
}

const OpeningHoursInput: React.FC<OpeningHoursInputProps> = ({ value, onChange }) => {
  // Initialize schedule from the input string or with default values
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    try {
      // Try to parse existing value
      if (value) {
        const parsedSchedule: Partial<WeekSchedule> = {};
        
        // Simple parsing of formatted string like "Mon-Fri: 9am-5pm, Sat-Sun: 10am-4pm"
        const parts = value.split(',').map(part => part.trim());
        
        parts.forEach(part => {
          const [days, hours] = part.split(':').map(p => p.trim());
          
          if (days && hours) {
            let daysList: WeekDay[] = [];
            
            // Handle day ranges like "Mon-Fri"
            if (days.includes('-')) {
              const [startDay, endDay] = days.split('-');
              const startIndex = DAYS_OF_WEEK.findIndex(d => d.toLowerCase().startsWith(startDay.toLowerCase()));
              const endIndex = DAYS_OF_WEEK.findIndex(d => d.toLowerCase().startsWith(endDay.toLowerCase()));
              
              if (startIndex >= 0 && endIndex >= 0) {
                daysList = DAYS_OF_WEEK.slice(startIndex, endIndex + 1);
              }
            } else {
              // Handle individual days
              const dayIndex = DAYS_OF_WEEK.findIndex(d => d.toLowerCase().startsWith(days.toLowerCase()));
              if (dayIndex >= 0) {
                daysList = [DAYS_OF_WEEK[dayIndex]];
              }
            }
            
            // Parse hours like "9am-5pm"
            const [openTime, closeTime] = hours.split('-').map(h => h.trim());
            
            if (openTime && closeTime && daysList.length > 0) {
              const timeRange: TimeRange = {
                open: formatTimeString(openTime),
                close: formatTimeString(closeTime)
              };
              
              daysList.forEach(day => {
                parsedSchedule[day] = {
                  isOpen: true,
                  timeRanges: [timeRange]
                };
              });
            }
          }
        });
        
        // Fill any missing days with closed status
        DAYS_OF_WEEK.forEach(day => {
          if (!parsedSchedule[day]) {
            parsedSchedule[day] = {
              isOpen: false,
              timeRanges: [{ ...DEFAULT_TIME_RANGE }]
            };
          }
        });
        
        return parsedSchedule as WeekSchedule;
      }
    } catch (error) {
      console.error("Error parsing opening hours:", error);
    }
    
    // Default schedule: Mon-Fri 9-5, weekends closed
    return DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = {
        isOpen: ['saturday', 'sunday'].includes(day) ? false : true,
        timeRanges: [{ ...DEFAULT_TIME_RANGE }]
      };
      return acc;
    }, {} as WeekSchedule);
  });

  // Convert the internal time format to a display string for the input field
  const formatScheduleToString = (schedule: WeekSchedule): string => {
    const dayGroups: { [key: string]: WeekDay[] } = {};
    
    // Group days with same schedule
    DAYS_OF_WEEK.forEach(day => {
      if (!schedule[day].isOpen) return;
      
      const daySchedule = schedule[day];
      const scheduleKey = daySchedule.timeRanges
        .map(range => `${range.open}-${range.close}`)
        .join(', ');
      
      if (!dayGroups[scheduleKey]) {
        dayGroups[scheduleKey] = [];
      }
      
      dayGroups[scheduleKey].push(day);
    });
    
    // Format each group
    const formattedGroups = Object.entries(dayGroups).map(([scheduleKey, days]) => {
      // Format days (e.g., "Mon-Fri" or "Sat, Sun")
      let formattedDays = '';
      
      if (days.length > 0) {
        const consecutiveGroups: WeekDay[][] = [];
        let currentGroup: WeekDay[] = [days[0]];
        
        for (let i = 1; i < days.length; i++) {
          const currentDayIndex = DAYS_OF_WEEK.indexOf(days[i-1]);
          const nextDayIndex = DAYS_OF_WEEK.indexOf(days[i]);
          
          if (nextDayIndex - currentDayIndex === 1) {
            currentGroup.push(days[i]);
          } else {
            consecutiveGroups.push([...currentGroup]);
            currentGroup = [days[i]];
          }
        }
        
        if (currentGroup.length > 0) {
          consecutiveGroups.push(currentGroup);
        }
        
        formattedDays = consecutiveGroups.map(group => {
          if (group.length > 2) {
            return `${capitalizeFirst(group[0])}-${capitalizeFirst(group[group.length-1])}`;
          } else {
            return group.map(day => capitalizeFirst(day)).join(', ');
          }
        }).join(', ');
      }
      
      // Format hours
      const timeRanges = scheduleKey.split(', ').map(range => {
        const [open, close] = range.split('-');
        return `${formatTime12Hour(open)}-${formatTime12Hour(close)}`;
      }).join(', ');
      
      return `${formattedDays}: ${timeRanges}`;
    });
    
    const closedDays = DAYS_OF_WEEK.filter(day => !schedule[day].isOpen);
    if (closedDays.length > 0 && formattedGroups.length > 0) {
      if (closedDays.length === 7) {
        return "Closed";
      } else {
        const formattedClosedDays = formatDaysList(closedDays);
        formattedGroups.push(`${formattedClosedDays}: Closed`);
      }
    }
    
    return formattedGroups.join(', ');
  };
  
  // Helper function to format a 24-hour time string to 12-hour format
  const formatTime12Hour = (time24: string): string => {
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return time24;
      
      const period = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      return `${hours12}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}${period}`;
    } catch (error) {
      return time24;
    }
  };
  
  // Convert formats like "9am" to "09:00"
  const formatTimeString = (timeStr: string): string => {
    try {
      let hours = 0;
      let minutes = 0;
      
      // Check if the time has am/pm
      const isPM = timeStr.toLowerCase().includes('pm');
      const isAM = timeStr.toLowerCase().includes('am');
      
      // Remove am/pm and trim
      let time = timeStr.toLowerCase().replace(/(am|pm)/g, '').trim();
      
      // Parse hours and minutes
      if (time.includes(':')) {
        const [h, m] = time.split(':');
        hours = parseInt(h, 10);
        minutes = parseInt(m, 10);
      } else {
        hours = parseInt(time, 10);
        minutes = 0;
      }
      
      // Adjust for PM
      if (isPM && hours < 12) {
        hours += 12;
      }
      // Adjust for 12 AM
      if (isAM && hours === 12) {
        hours = 0;
      }
      
      // Format as 24-hour time
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return "09:00"; // Default fallback
    }
  };
  
  // Helper to capitalize the first letter of a string
  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1, 3);
  };
  
  // Format a list of days (e.g., ["monday", "tuesday"] => "Mon-Tue" or "Mon, Tue")
  const formatDaysList = (days: WeekDay[]): string => {
    if (days.length === 0) return "";
    
    const sortedDays = [...days].sort((a, b) => 
      DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
    );
    
    const consecutiveGroups: WeekDay[][] = [];
    let currentGroup: WeekDay[] = [sortedDays[0]];
    
    for (let i = 1; i < sortedDays.length; i++) {
      const currentDayIndex = DAYS_OF_WEEK.indexOf(sortedDays[i-1]);
      const nextDayIndex = DAYS_OF_WEEK.indexOf(sortedDays[i]);
      
      if (nextDayIndex - currentDayIndex === 1) {
        currentGroup.push(sortedDays[i]);
      } else {
        consecutiveGroups.push([...currentGroup]);
        currentGroup = [sortedDays[i]];
      }
    }
    
    if (currentGroup.length > 0) {
      consecutiveGroups.push(currentGroup);
    }
    
    return consecutiveGroups.map(group => {
      if (group.length > 2) {
        return `${capitalizeFirst(group[0])}-${capitalizeFirst(group[group.length-1])}`;
      } else {
        return group.map(day => capitalizeFirst(day)).join(', ');
      }
    }).join(', ');
  };

  // Update the schedule when a day's "open" status changes
  const handleDayOpenChange = (day: WeekDay, isOpen: boolean) => {
    setSchedule(prev => {
      const updated = { ...prev };
      updated[day] = {
        ...updated[day],
        isOpen
      };
      
      const newValue = formatScheduleToString(updated);
      onChange(newValue);
      
      return updated;
    });
  };

  // Update a time range for a specific day
  const handleTimeRangeChange = (day: WeekDay, index: number, field: keyof TimeRange, value: string) => {
    setSchedule(prev => {
      const updated = { ...prev };
      const timeRanges = [...updated[day].timeRanges];
      timeRanges[index] = { ...timeRanges[index], [field]: value };
      
      updated[day] = {
        ...updated[day],
        timeRanges
      };
      
      const newValue = formatScheduleToString(updated);
      onChange(newValue);
      
      return updated;
    });
  };

  // Apply the same schedule to all weekdays
  const applyToAllWeekdays = () => {
    const weekdayTemplate = schedule.monday;
    
    setSchedule(prev => {
      const updated = { ...prev };
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        updated[day as WeekDay] = { ...weekdayTemplate };
      });
      
      const newValue = formatScheduleToString(updated);
      onChange(newValue);
      
      return updated;
    });
  };

  // Apply the same schedule to all weekend days
  const applyToAllWeekends = () => {
    const weekendTemplate = schedule.saturday;
    
    setSchedule(prev => {
      const updated = { ...prev };
      ['saturday', 'sunday'].forEach(day => {
        updated[day as WeekDay] = { ...weekendTemplate };
      });
      
      const newValue = formatScheduleToString(updated);
      onChange(newValue);
      
      return updated;
    });
  };

  // Apply a schedule to all days
  const applyToAllDays = () => {
    const template = schedule.monday;
    
    setSchedule(prev => {
      const updated = { ...prev };
      DAYS_OF_WEEK.forEach(day => {
        updated[day] = { ...template };
      });
      
      const newValue = formatScheduleToString(updated);
      onChange(newValue);
      
      return updated;
    });
  };

  // Handle presets for common schedules
  const applyPreset = (preset: string) => {
    let newSchedule: WeekSchedule;
    
    switch (preset) {
      case 'business':
        // Business hours: Mon-Fri 9-5, closed weekends
        newSchedule = DAYS_OF_WEEK.reduce((acc, day) => {
          acc[day] = {
            isOpen: !['saturday', 'sunday'].includes(day),
            timeRanges: [{ open: '09:00', close: '17:00' }]
          };
          return acc;
        }, {} as WeekSchedule);
        break;
        
      case 'restaurant':
        // Restaurant hours: Daily 11am-10pm
        newSchedule = DAYS_OF_WEEK.reduce((acc, day) => {
          acc[day] = {
            isOpen: true,
            timeRanges: [{ open: '11:00', close: '22:00' }]
          };
          return acc;
        }, {} as WeekSchedule);
        break;
        
      case 'retail':
        // Retail hours: Mon-Sat 10am-9pm, Sun 11am-6pm
        newSchedule = DAYS_OF_WEEK.reduce((acc, day) => {
          if (day === 'sunday') {
            acc[day] = {
              isOpen: true,
              timeRanges: [{ open: '11:00', close: '18:00' }]
            };
          } else {
            acc[day] = {
              isOpen: true,
              timeRanges: [{ open: '10:00', close: '21:00' }]
            };
          }
          return acc;
        }, {} as WeekSchedule);
        break;
        
      case 'cafe':
        // Cafe hours: Daily 7am-7pm
        newSchedule = DAYS_OF_WEEK.reduce((acc, day) => {
          acc[day] = {
            isOpen: true,
            timeRanges: [{ open: '07:00', close: '19:00' }]
          };
          return acc;
        }, {} as WeekSchedule);
        break;
        
      case 'museum':
        // Museum hours: Tue-Sun 10am-6pm, closed Mondays
        newSchedule = DAYS_OF_WEEK.reduce((acc, day) => {
          acc[day] = {
            isOpen: day !== 'monday',
            timeRanges: [{ open: '10:00', close: '18:00' }]
          };
          return acc;
        }, {} as WeekSchedule);
        break;
        
      default:
        return;
    }
    
    setSchedule(newSchedule);
    const newValue = formatScheduleToString(newSchedule);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="opening-hours">Horário de Funcionamento</Label>
        <Input
          id="opening-hours"
          value={formatScheduleToString(schedule)}
          readOnly
          placeholder="e.g., Seg-Sex: 9am-5pm, Sáb-Dom: 10am-4pm"
          className="w-full bg-background"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        <div className="text-sm text-muted-foreground mb-1 w-full">Modelos predefinidos:</div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => applyPreset('business')}
          className="text-xs h-7"
        >
          Comercial
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => applyPreset('restaurant')}
          className="text-xs h-7"
        >
          Restaurante
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => applyPreset('retail')}
          className="text-xs h-7"
        >
          Loja
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => applyPreset('cafe')}
          className="text-xs h-7"
        >
          Café
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => applyPreset('museum')}
          className="text-xs h-7"
        >
          Museu
        </Button>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="customize">
          <AccordionTrigger className="text-sm">Personalizar horários</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={applyToAllWeekdays}
                  className="text-xs"
                >
                  Aplicar dias úteis a todos
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={applyToAllWeekends}
                  className="text-xs"
                >
                  Aplicar fins de semana a todos
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={applyToAllDays}
                  className="text-xs"
                >
                  Aplicar segunda a todos
                </Button>
              </div>
              
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${day}-open`}
                        checked={schedule[day].isOpen}
                        onCheckedChange={(checked) => 
                          handleDayOpenChange(day, checked === true)
                        }
                      />
                      <label 
                        htmlFor={`${day}-open`}
                        className="font-medium capitalize"
                      >
                        {day === 'monday' ? 'Segunda' : 
                         day === 'tuesday' ? 'Terça' : 
                         day === 'wednesday' ? 'Quarta' : 
                         day === 'thursday' ? 'Quinta' : 
                         day === 'friday' ? 'Sexta' : 
                         day === 'saturday' ? 'Sábado' : 'Domingo'}
                      </label>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {schedule[day].isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                  
                  {schedule[day].isOpen && schedule[day].timeRanges.map((timeRange, index) => (
                    <div key={index} className="flex space-x-2 mt-2">
                      <div className="flex-1">
                        <Label htmlFor={`${day}-open-${index}`} className="text-xs">Abre</Label>
                        <Input
                          id={`${day}-open-${index}`}
                          type="time"
                          value={timeRange.open}
                          onChange={(e) => 
                            handleTimeRangeChange(day, index, 'open', e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`${day}-close-${index}`} className="text-xs">Fecha</Label>
                        <Input
                          id={`${day}-close-${index}`}
                          type="time"
                          value={timeRange.close}
                          onChange={(e) => 
                            handleTimeRangeChange(day, index, 'close', e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default OpeningHoursInput;
