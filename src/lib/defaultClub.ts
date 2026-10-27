import type { ClubData } from '../types';

export function createDefaultClub(): ClubData {
  return {
    clubName: 'DeckGala Swim Club',
    groups: [
      {
        id: 'grp-senior-perf',
        name: 'Senior Performance',
        description: 'National & regional qualifiers — high-intensity aerobic & race pace',
        coach: 'Coach Sarah Jenkins',
        color: 'cyan',
        swimmers: [
          { id: 'sw-1', name: 'Alex Rivera', age: 17, gender: 'M', pb50m: '24.10', pb100m: '52.40', notes: 'Strong underwater kick' },
          { id: 'sw-2', name: 'Sam Chen', age: 16, gender: 'M', pb50m: '25.30', pb100m: '55.80', notes: 'Distance specialist' },
          { id: 'sw-3', name: 'Jordan Taylor', age: 18, gender: 'F', pb50m: '27.80', pb100m: '59.50', notes: 'Fast tempo' },
          { id: 'sw-4', name: 'Taylor Brooks', age: 17, gender: 'F', pb50m: '26.20', pb100m: '56.90', notes: 'Threshold specialist' },
          { id: 'sw-5', name: 'Riley Kim', age: 16, gender: 'M', pb50m: '29.40', pb100m: '1:04.20', notes: 'Watch pullout timing' },
          { id: 'sw-6', name: 'Jamie Patel', age: 17, gender: 'F', pb50m: '27.10', pb100m: '58.30', notes: 'Smooth transitions' }
        ]
      },
      {
        id: 'grp-age-group-gold',
        name: 'Age Group Gold',
        description: 'County & regional age group swimmers (13–15 yrs)',
        coach: 'Coach Marcus Vance',
        color: 'teal',
        swimmers: [
          { id: 'sw-7', name: 'Morgan Vance', age: 14, gender: 'F', pb50m: '28.10', pb100m: '1:01.00', notes: '' },
          { id: 'sw-8', name: 'Avery Lin', age: 15, gender: 'F', pb50m: '29.00', pb100m: '1:03.50', notes: '' },
          { id: 'sw-9', name: 'Quinn Reyes', age: 14, gender: 'M', pb50m: '28.90', pb100m: '1:02.40', notes: '' },
          { id: 'sw-10', name: 'Devon Price', age: 15, gender: 'M', pb50m: '27.40', pb100m: '59.80', notes: '' },
          { id: 'sw-11', name: 'Skyler Diaz', age: 13, gender: 'F', pb50m: '32.10', pb100m: '1:10.20', notes: '' },
          { id: 'sw-12', name: 'Peyton Cruz', age: 14, gender: 'M', pb50m: '29.50', pb100m: '1:04.80', notes: '' }
        ]
      },
      {
        id: 'grp-junior-dev',
        name: 'Junior Development',
        description: 'Stroke technique, turns & aerobic foundation (10–12 yrs)',
        coach: 'Coach Elena Rostova',
        color: 'amber',
        swimmers: [
          { id: 'sw-13', name: 'Hayden Ross', age: 12, gender: 'M', pb50m: '31.20', pb100m: '1:08.50', notes: '' },
          { id: 'sw-14', name: 'Emerson Cole', age: 11, gender: 'F', pb50m: '33.40', pb100m: '1:12.00', notes: '' },
          { id: 'sw-15', name: 'Finley Shaw', age: 12, gender: 'M', pb50m: '35.80', pb100m: '1:18.20', notes: '' },
          { id: 'sw-16', name: 'Dakota West', age: 11, gender: 'F', pb50m: '34.10', pb100m: '1:15.40', notes: '' },
          { id: 'sw-17', name: 'Charlie Park', age: 10, gender: 'M', pb50m: '34.90', pb100m: '1:16.10', notes: '' },
          { id: 'sw-18', name: 'Blake Woods', age: 12, gender: 'F', pb50m: '32.70', pb100m: '1:11.30', notes: '' }
        ]
      },
      {
        id: 'grp-masters',
        name: 'Masters Fitness',
        description: 'Adult competitive & triathlon conditioning squad',
        coach: 'Coach David Sterling',
        color: 'violet',
        swimmers: [
          { id: 'sw-19', name: 'Logan Reed', age: 34, gender: 'M', pb50m: '26.80', pb100m: '58.90', notes: 'Triathlete' },
          { id: 'sw-20', name: 'Tatum Hayes', age: 29, gender: 'F', pb50m: '28.50', pb100m: '1:02.10', notes: 'Open water' },
          { id: 'sw-21', name: 'Parker Webb', age: 42, gender: 'M', pb50m: '31.90', pb100m: '1:09.80', notes: '' }
        ]
      }
    ]
  };
}

