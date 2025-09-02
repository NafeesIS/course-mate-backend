export interface TPartner {
  partnerId: string;
  userId: {
    $oid: string;
  };
  status: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  copDetails: {
    profileImg: string;
    membershipNumber: string;
    name: string;
    cpNumber: string;
    designation: string;
  };
  firmDetails: {
    firmType: string;
    firmName: string;
    numberOfEmployees: number;
    firmAddress: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    firmMobileNumber: string;
    firmEmail: string;
    partners: {
      partnerName: string;
      partnerMembershipNumber: string;
    }[];
    numberOfPartners: number;
  };
  practiceDetails: {
    about: string;
    areaOfSpecialization: {
      value: string;
      label: string;
    }[];
    clientsHandled: {
      value: string;
      label: string;
    }[];
    certifications: string[];
    affiliations: string[];
    socialMediaLinks: {
      website: { link: string };
      linkedin: { link: string };
      twitter: { link: string };
      facebook: { link: string };
      businessPlatform: { link: string };
      blogSite: { link: string };
    };
  };
  createdAt: {
    $date: string;
  };
  updatedAt: {
    $date: string;
  };
}
