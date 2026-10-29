import { selectClub } from "./actions";

interface ClubSwitcherProps {
  clubs: Array<{ clubId: string; club: { name: string } }>;
  selectedClubId: string;
}

export function ClubSwitcher({ clubs, selectedClubId }: ClubSwitcherProps) {
  return (
    <form action={selectClub} className="club-switcher">
      <label htmlFor="club-select">Your clubs</label>
      <select id="club-select" name="clubId" defaultValue={selectedClubId}>
        {clubs.map(({ clubId, club }) => <option key={clubId} value={clubId}>{club.name}</option>)}
      </select>
      <button className="button-secondary" type="submit">Switch club</button>
    </form>
  );
}
