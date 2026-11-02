import { demoDataset } from '@ps5/data/demo';
import { CompatibilityPage } from './CompatibilityPage';
export default function DemoCompatibilityPage() {
  return <CompatibilityPage key="demo" data={demoDataset} mode="demo" />;
}
