export const normalizeTenant = (t = {}) => {
  // Handle nested room object from detail API
  const room = t.room || t.roomDetails || t.assignedRoom || {};

  const photo =
    t.userPhoto ||
    t.passportPhoto ||
    t.photo ||
    t.profilePhoto ||
    t.tenantPhoto ||
    '';

  const idProof =
    t.govtIdFront ||
    t.aadhaarPhoto ||
    t.idProof ||
    t.id_proof ||
    t.govtIdBack ||
    t.documentImage ||
    (Array.isArray(t.idProofs) ? t.idProofs[0] : t.idProofs?.govtIdFront) ||
    '';

  return {
    ...t,
    _id: t._id || t.id,
    name: t.name || t.tenantName || '',
    phone: t.phone || t.mobile || t.contactnumber || '',
    email: t.email || '',
    altPhone: t.altPhone || t.alt_phone || t.alternatePhone || '',
    aadhaar: t.aadhaar || t.aadharNumber || t.aadhar || t.govtIdNumber || '',
    occupation: t.occupation || '',
    occupationAddress: t.occupationAddress || t.occupation_address || '',
    address: t.permanentAddress || t.permanent_address || t.address || '',
    roomId: t.roomId || t.room_id || room._id || room.id || t.room || '',
    roomNumber: t.roomNumber || t.room_number || room.roomNumber || room.room_number || '',
    bedNumber: t.bedNumber || t.bed_number || room.bedNumber || room.bed_number || '',
    monthlyRent: t.monthlyRent || t.rent || t.rentAmount || '',
    securityDeposit: t.securityDeposit || t.deposit || t.advanceAmount || '',
    joiningDate: t.joiningDate || t.joining_date || t.checkInDate || t.checkinDate || '',
    emergencyContact:
      t.emergencyContact ||
      t.guardianName ||
      t.fatherName ||
      t.motherName ||
      '',
    emergencyPhone:
      t.emergencyPhone ||
      t.guardianPhone ||
      t.fatherPhone ||
      t.motherPhone ||
      '',
    photo,
    idProof,
  };
};

export const denormalizeTenant = (formData) => {
  const payload = {
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    altPhone: formData.altPhone,
    aadhaar: formData.aadhaar,
    occupation: formData.occupation,
    permanentAddress: formData.address,
    roomId: formData.roomId,
    bedNumber: formData.bedNumber,
    monthlyRent: formData.monthlyRent,
    securityDeposit: formData.securityDeposit,
    joiningDate: formData.joiningDate,
    guardianName: formData.emergencyContact,
    guardianPhone: formData.emergencyPhone,
    status: formData.status,
    userPhoto: formData.photo,
    govtIdFront: formData.idProof,
  };

  // Remove empty values to avoid overwriting existing data on partial edits
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};
