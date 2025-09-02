import { leadOwners } from '../zoho.constant';
import { ZohoLeadAssignment, ZohoLeadOwnerIndex } from '../zoho.model';

const getNextOwner = async (cin: string): Promise<(typeof leadOwners)[0]> => {
  let assignment = await ZohoLeadAssignment.findOne({ cin });

  if (assignment) {
    // If an assignment exists for this CIN, return the corresponding owner
    return leadOwners[assignment.ownerIndex];
  }

  // If no assignment exists, get the next available owner index
  let ownerIndexDoc = await ZohoLeadOwnerIndex.findOne({ key: 'currentIndex' });
  if (!ownerIndexDoc) {
    ownerIndexDoc = new ZohoLeadOwnerIndex({ key: 'currentIndex', value: 0 });
  }

  const currentIndex = ownerIndexDoc.value;
  const nextIndex = (currentIndex + 1) % leadOwners.length;

  // Update the current index
  await ZohoLeadOwnerIndex.updateOne(
    { key: 'currentIndex' },
    { $set: { value: nextIndex } },
    { upsert: true }
  );

  // Create a new assignment for this CIN
  assignment = new ZohoLeadAssignment({
    cin,
    ownerIndex: currentIndex,
  });
  await assignment.save();

  return leadOwners[currentIndex];
};

export default getNextOwner;
