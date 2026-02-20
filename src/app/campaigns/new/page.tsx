import CampaignBuilderFinal from "@/components/crm/CampaignBuilderFinal";

export default function NewCampaignPage() {
    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white">Create Campaign</h1>
                <p className="text-slate-400 text-sm mt-1">Build and launch a campaign in three simple steps.</p>
            </div>
            <CampaignBuilderFinal />
        </div>
    );
}
