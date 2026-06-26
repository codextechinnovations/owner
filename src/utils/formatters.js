export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const formatDateLong = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateShort = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const ordinalSuffix = (n) => {
  const m = n % 100;
  if (m >= 11 && m <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

export const getFloorRank = (floor) => {
  if (!floor) return 999;
  const lower = String(floor).toLowerCase();
  if (lower.includes('ground')) return 0;
  const match = floor.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
};

export const getRoomNumberValue = (roomNumber) => {
  if (!roomNumber) return 0;
  const match = String(roomNumber).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : roomNumber;
};

export const sortRooms = (rooms) => {
  return [...rooms].sort((a, b) => {
    const floorDiff = getFloorRank(a.floor) - getFloorRank(b.floor);
    if (floorDiff !== 0) return floorDiff;
    const roomA = getRoomNumberValue(a.roomNumber || a.room_number);
    const roomB = getRoomNumberValue(b.roomNumber || b.room_number);
    if (typeof roomA === 'number' && typeof roomB === 'number') return roomA - roomB;
    return String(a.roomNumber || a.room_number || '').localeCompare(String(b.roomNumber || b.room_number || ''));
  });
};

export const getRoomStatus = (room) => {
  const occupied = room.occupiedBeds || room.occupied_beds || 0;
  const capacity = room.capacity || 0;
  if (occupied === 0) return 'Vacant';
  if (occupied >= capacity) return 'Occupied';
  return 'Partial';
};

export const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};
