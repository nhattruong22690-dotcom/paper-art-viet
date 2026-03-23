import TeamWorkLog from '@/components/production/TeamWorkLog';

export const metadata = {
  title: 'Team Work Log | Paper Art Việt',
  description: 'Batch production reporting for team leaders',
};

export default function TeamWorkLogPage() {
  return (
    <div className="p-8">
      <TeamWorkLog />
    </div>
  );
}
