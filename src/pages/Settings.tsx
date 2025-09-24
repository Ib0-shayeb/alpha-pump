import { Layout } from "@/components/Layout";
import { PrivacySettings } from "@/components/PrivacySettings";

const Settings = () => {
  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <PrivacySettings />
      </div>
    </Layout>
  );
};

export default Settings;


