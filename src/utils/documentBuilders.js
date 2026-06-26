import { getImageHtml, getLogoHtml, urlToBase64 } from './logoHelper';
import { formatDateShort, formatTime, ordinalSuffix, addMonths } from './formatters';

const DEFAULT_RULES = [
  'Maintain silence between 10:00 PM and 6:00 AM.',
  'Visitors are allowed only in the common area till 8:00 PM.',
  'Consumption of alcohol, tobacco, or illegal substances is strictly prohibited.',
  'Keep your room and common areas clean and hygienic.',
  'Switch off lights, fans, and electrical appliances when not in use.',
  'Do not damage property or furniture; charges will apply for repairs.',
  'Intimate the owner at least 30 days before vacating.',
  'Rent must be paid on or before the 5th of every month.',
  'Pets are not allowed without prior written permission.',
  'Follow all safety and fire guidelines instructed by the management.',
];

export const fetchDocumentPhotos = async (tenant) => {
  const tenantPhotoUrl = tenant?.userPhoto || tenant?.passportPhoto || '';
  const aadhaarPhotoUrl =
    tenant?.govtIdFront || tenant?.aadhaarPhoto || tenant?.idProof || tenant?.id_proof || '';

  const [tenantPhotoBase64, aadhaarPhotoBase64] = await Promise.all([
    tenantPhotoUrl ? urlToBase64(tenantPhotoUrl) : null,
    aadhaarPhotoUrl ? urlToBase64(aadhaarPhotoUrl) : null,
  ]);

  return { tenantPhotoBase64, aadhaarPhotoBase64 };
};

export const buildRentAgreementHtml = (tenant, pgInfo, logoBase64) => {
  const theme = '#1a1a4e';
  const themeLight = '#EEF2FF';
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const startDate = tenant.joiningDate ? new Date(tenant.joiningDate) : today;
  const startDateStr = startDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const agreementMonths = 11;
  const endDate = addMonths(startDate, agreementMonths);
  const endDateStr = endDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const lockIn = 6;
  const notice = 30;
  const curfew = '10:00 PM';
  const fine = 500;

  const rent = tenant.monthlyRent || tenant.rent || 0;
  const deposit = tenant.securityDeposit || tenant.deposit || tenant.advanceAmount || 0;
  const tenantName = tenant.name || tenant.tenantName || '';
  const pg = pgInfo.name || 'My PG';
  const pgAddr = pgInfo.address || '';
  const owner = pgInfo.ownerName || '';
  const logo = logoBase64 ? getLogoHtml(logoBase64, 44) : '';
  const roomNo = tenant.roomNumber || tenant.room_number || '___';
  const sharing = tenant.stayType || tenant.stay_type || '___';
  const rentDueDay = tenant.rentDueDay || 5;
  const aadhaar = tenant.aadhaar || tenant.aadharNumber || '___';
  const permanentAddress = tenant.permanentAddress || tenant.address || '___';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          padding: 0;
          margin: 0;
          color: #1f2937;
          line-height: 1.6;
          font-size: 13px;
        }
        .page {
          padding: 32px 36px;
          max-width: 800px;
          margin: 0 auto;
        }
        .top-bar {
          background: ${theme};
          color: #fff;
          padding: 14px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .top-bar-left { display: flex; align-items: center; gap: 12px; }
        .top-bar-title { font-size: 18px; font-weight: 700; }
        .top-bar-sub { font-size: 10px; color: #c7d2fe; }
        .doc-title {
          text-align: center;
          color: ${theme};
          font-size: 22px;
          font-weight: 800;
          margin: 26px 0 6px;
        }
        .doc-subtitle {
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 22px;
        }
        .section {
          margin-bottom: 18px;
          page-break-inside: avoid;
        }
        .section-title {
          background: ${theme};
          color: #fff;
          padding: 8px 14px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .field-row {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          padding: 7px 0;
        }
        .field-label {
          width: 42%;
          font-weight: 600;
          color: #374151;
          padding-right: 12px;
        }
        .field-value {
          flex: 1;
          color: #111827;
        }
        p { margin: 0 0 8px 0; text-align: justify; }
        .clause { margin-bottom: 8px; text-align: justify; }
        .clause-number { font-weight: 700; color: ${theme}; }
        .annexure-list { margin: 0; padding-left: 18px; }
        .annexure-list li { margin-bottom: 6px; }
        .handover-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .handover-table th, .handover-table td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
        }
        .handover-table th {
          background: ${themeLight};
          color: ${theme};
          font-weight: 700;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          gap: 40px;
        }
        .sign-box {
          flex: 1;
          text-align: center;
        }
        .sign-line {
          border-top: 1px solid #1f2937;
          margin-top: 50px;
          padding-top: 8px;
          font-weight: 600;
        }
        .bottom-footer {
          background: ${theme};
          color: #fff;
          text-align: center;
          padding: 10px 36px;
          font-size: 11px;
          margin-top: 30px;
        }
        .footer-note {
          text-align: center;
          font-size: 11px;
          color: #6b7280;
          margin-top: 12px;
        }
        @media print {
          .page { padding: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="top-bar">
        <div class="top-bar-left">
          ${logo}
          <div>
            <div class="top-bar-title">${pg}</div>
            <div class="top-bar-sub">${pgAddr}</div>
          </div>
        </div>
      </div>

      <div class="page">
        <div class="doc-title">Rent Agreement &amp; Property Rules</div>
        <div class="doc-subtitle">Generated via ManageYourPG</div>

        <div class="section">
          <div class="section-title">1. Renting Details</div>
          <div class="field-row"><div class="field-label">Rented Property Address</div><div class="field-value">${pgAddr}</div></div>
          <div class="field-row"><div class="field-label">Unit / Room No.</div><div class="field-value">${roomNo}</div></div>
          <div class="field-row"><div class="field-label">Room Sharing Type</div><div class="field-value">${sharing}</div></div>
          <div class="field-row"><div class="field-label">Agreement Duration</div><div class="field-value">${agreementMonths} months — from ${startDateStr} to ${endDateStr}</div></div>
          <div class="field-row"><div class="field-label">Monthly Rent</div><div class="field-value">₹${Number(rent).toLocaleString('en-IN')} per month</div></div>
          <div class="field-row"><div class="field-label">Rent Due Date</div><div class="field-value">On or before the ${rentDueDay}${ordinalSuffix(rentDueDay)} of every month</div></div>
          <div class="field-row"><div class="field-label">Security Deposit</div><div class="field-value">₹${Number(deposit).toLocaleString('en-IN')} (one-time, interest-free)</div></div>
          <div class="field-row"><div class="field-label">Lock-In Period</div><div class="field-value">${lockIn} months</div></div>
          <div class="field-row"><div class="field-label">Notice Period</div><div class="field-value">${notice} days</div></div>
        </div>

        <div class="section">
          <div class="section-title">2. Parties to the Agreement</div>
          <p>This Leave and License Agreement is made and executed on <strong>${todayStr}</strong> between <strong>${owner || '____________________'}</strong>, residing at <strong>${pgAddr}</strong> (hereinafter the “Owner”),</p>
          <p>AND</p>
          <p><strong>${tenantName}</strong>, holding ID/UID <strong>${aadhaar}</strong>, residing at <strong>${permanentAddress}</strong> (hereinafter the “Tenant”).</p>
          <p>The Owner and the Tenant may individually be referred to as a “Party” and collectively as the “Parties.”</p>
          <p>Whereas the Owner is the absolute owner and in physical possession of the rented property described above (the “Said Premises”), and the Tenant has approached the Owner to take the Said Premises on rent, and the Owner has agreed to let it out on the following terms and conditions:</p>
        </div>

        <div class="section">
          <div class="section-title">3. Terms &amp; Conditions</div>
          <div class="clause"><span class="clause-number">1.</span> The tenancy of the Said Premises shall commence with effect from <strong>${startDateStr}</strong> and shall be valid for a limited period of <strong>${agreementMonths} months</strong> (the “Term”). On expiry of the Term, the Tenant shall vacate and hand over vacant possession of the Said Premises to the Owner without any hitch or hindrance.</div>
          <div class="clause"><span class="clause-number">2.</span> The Tenant agrees to pay the Owner an aggregate monthly rent of <strong>₹${Number(rent).toLocaleString('en-IN')}</strong> (the “Rent”), payable in advance for every month, on or before the <strong>${rentDueDay}${ordinalSuffix(rentDueDay)}</strong> of every month.</div>
          <div class="clause"><span class="clause-number">3.</span> The Tenant shall pay <strong>₹${Number(deposit).toLocaleString('en-IN')}</strong> as an interest-free security deposit to the Owner, which shall be refunded on expiry of the Term after deducting any arrears on rent, electricity, repairs, or other dues.</div>
          <div class="clause"><span class="clause-number">4.</span> A minimum lock-in period of <strong>${lockIn} months</strong> is mandatory. In case of early vacating within the lock-in period, the Owner shall be entitled to forfeit a proportionate amount for the shortfall period from the Security Deposit.</div>
          <div class="clause"><span class="clause-number">5.</span> The Tenant shall pay rent on time through the ManageYourPG Tenant App or by online transfer to the Owner's designated bank account, on or before the due date mentioned above.</div>
          <div class="clause"><span class="clause-number">6.</span> The Owner may send rent reminders through the ManageYourPG App and WhatsApp. Payment receipts will be issued digitally through the app.</div>
          <div class="clause"><span class="clause-number">7.</span> The Tenant shall use the Said Premises only for residential purposes for self, and not for any other purpose.</div>
          <div class="clause"><span class="clause-number">8.</span> The Tenant shall not sublet the Said Premises, or any portion thereof, to any other person under any circumstances.</div>
          <div class="clause"><span class="clause-number">9.</span> One set of original keys has been handed over to the Tenant. If any key is lost, the Tenant shall bear the cost of replacement, either directly or by deduction from the Security Deposit.</div>
          <div class="clause"><span class="clause-number">10.</span> The Owner shall be entitled to inspect the Said Premises at any reasonable time, with prior intimation, in the presence of the Tenant.</div>
          <div class="clause"><span class="clause-number">11.</span> The Tenant shall maintain the Said Premises in a neat, clean, and tenantable condition, and shall not damage the premises or alter any portion of it under any circumstances.</div>
          <div class="clause"><span class="clause-number">12.</span> If this Agreement is renewed for a further period, the Parties agree to execute a new agreement on mutually agreeable rent and terms.</div>
          <div class="clause"><span class="clause-number">13.</span> Either Party may terminate this Agreement earlier by giving <strong>${notice} days'</strong> advance written notice to the other Party, after the lock-in period ends. Failure to pay rent for any month shall entitle the Owner to terminate this Agreement without serving the notice period mentioned above.</div>
          <div class="clause"><span class="clause-number">14.</span> The Tenant shall comply with all applicable rules and regulations of the concerned government authorities, including those relating to water, electricity, and other local agencies governing the Said Premises.</div>
          <div class="clause"><span class="clause-number">15.</span> The Tenant has no ownership rights whatsoever over the Said Premises and shall not encumber the property in any manner.</div>
          <div class="clause"><span class="clause-number">16.</span> All electricity, water, and maintenance charges due before the Agreement Date are the Owner's responsibility; charges arising thereafter shall be borne by the Tenant.</div>
          <div class="clause"><span class="clause-number">17.</span> The cost of any damage to the Said Premises, or to fittings and fixtures, shall be recovered by the Owner from the interest-free Security Deposit.</div>
          <div class="clause"><span class="clause-number">18.</span> Both Parties shall abide by the applicable Rent Control Act and the terms and conditions of this Agreement.</div>
          <div class="clause"><span class="clause-number">19.</span> This Agreement reflects the terms finalized and understood by the Owner and the Tenant on their own, in a language understood by them, without the involvement of any other person or entity. Neither the platform, technology provider, nor any other person shall be responsible or liable for any dispute, litigation, or stamp duty matter arising in connection with this Agreement.</div>
          <div class="clause"><span class="clause-number">20.</span> <strong>Miscellaneous:</strong> This Agreement constitutes the entire understanding between the Parties concerning its subject matter and supersedes any prior written or oral representations. No modification, amendment, or waiver of any provision shall bind the Parties unless made in writing and signed by both Parties. If any provision of this Agreement is held unenforceable, the remaining provisions shall continue in full force and effect.</div>
        </div>

        <div class="section">
          <div class="section-title">4. Annexure 1 — Tasks via ManageYourPG App</div>
          <p style="font-weight:600; margin:10px 0 6px;">Tenant KYC</p>
          <ul class="annexure-list">
            <li>To complete Background Screening, the Joining Form, the Rent Agreement, and Police Verification as required by applicable tenancy regulations, the Tenant must submit complete details and a Government ID through the app's check-in link within 24 hours of the Joining Date.</li>
            <li>The Tenant's KYC data may be shared with authorized technology and government partners to complete Background Screening, e-KYC, and Police Tenant Verification/Registration.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Payments</p>
          <ul class="annexure-list">
            <li>All dues — rent, electricity, water, and maintenance — will be shown in real time on the ManageYourPG Tenant App.</li>
            <li>The Tenant shall make payments only through the payment link shared on WhatsApp, the Tenant App, or the official payment QR code.</li>
            <li>Supported payment methods include UPI (Paytm, PhonePe, GPay, BHIM), NEFT/RTGS, and credit/debit cards.</li>
            <li>Cash payments are accepted only through the in-app “Cash via OTP” method, paid to the authorized rent collector list for ${pg}.</li>
            <li>A digital payment receipt will be issued automatically via WhatsApp, email, and the Tenant App.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Food Menu</p>
          <ul class="annexure-list">
            <li>The weekly food menu and meal timings will be updated on the Tenant App.</li>
            <li>If the Tenant arrives after meal timings, arranging food becomes the Tenant's own responsibility.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Announcements / Digital Notice Board</p>
          <ul class="annexure-list">
            <li>Important notices and announcements (electricity cuts, water issues, Wi-Fi, mess timings, etc.) will be sent via the Tenant App, with additional alerts via WhatsApp/SMS.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Complaints</p>
          <ul class="annexure-list">
            <li>Feedback, complaints, and suggestions from tenants are welcome at any time.</li>
            <li>Maintenance issues (plumbing, wiring, etc.) should be reported immediately through the Tenant App's complaint feature.</li>
            <li>Complaints must be genuine; repeated fake complaints may attract a fine of ₹${fine}.</li>
            <li>The Tenant will receive real-time notifications when a complaint is assigned and when it is resolved.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Leave Property / Eviction Notice</p>
          <ul class="annexure-list">
            <li>A minimum notice period of ${notice} days is required before vacating, submitted via the Tenant App.</li>
            <li>Eviction terms and rules are displayed on the Tenant App and must be met for approval.</li>
            <li>Notices of leaving/eviction submitted through any other mode will not be accepted.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Late Check-in</p>
          <ul class="annexure-list">
            <li>Where a night curfew applies, the Tenant must register a “Late Check-in Request” by 9 PM via the Tenant App.</li>
            <li>Entry gates close at ${curfew}. Without a Late Check-in request, entry after this time may not be permitted.</li>
          </ul>
          <p style="font-weight:600; margin:10px 0 6px;">Guest Invite</p>
          <ul class="annexure-list">
            <li>Tenants must add guest details in the Tenant App for management's information and approval before any guest visits.</li>
          </ul>
        </div>

        <div class="section">
          <div class="section-title">5. Annexure 2 — Handover Item List</div>
          <p>Items provided by the Owner at the time of handover of the Said Premises to the Tenant:</p>
          <table class="handover-table">
            <tr><th>Item</th><th>Quantity</th></tr>
            <tr><td>AC</td><td>___</td></tr>
            <tr><td>Almirah / Cupboard</td><td>___</td></tr>
            <tr><td>Bed</td><td>___</td></tr>
            <tr><td>Mattress</td><td>___</td></tr>
            <tr><td>Chair</td><td>___</td></tr>
            <tr><td>Study Table</td><td>___</td></tr>
            <tr><td>Electric Geyser</td><td>___</td></tr>
            <tr><td>Fan</td><td>___</td></tr>
            <tr><td>Other Item</td><td>___</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">6. Dispute Resolution</div>
          <div class="clause"><span class="clause-number">1.</span> A Party raising a dispute shall notify the other Party in writing, requesting an amicable settlement within fifteen (15) days of receipt of such notice.</div>
          <div class="clause"><span class="clause-number">2.</span> The matter will be referred for negotiation between designated representatives of both Parties, with the agreed course of action documented within a further 30 days.</div>
          <div class="clause"><span class="clause-number">3.</span> Any dispute not resolved through negotiation may be referred to arbitration under the Arbitration and Conciliation Act, 1996 (as amended), to be held at the location specified under Governing Law. The arbitration award shall be final and binding.</div>
          <p><strong>Governing Law:</strong> This Agreement shall be governed by the applicable laws of India. Any dispute shall be subject to the exclusive jurisdiction of the courts at Bangalore, India.</p>
        </div>

        <p style="margin-top:24px;"><strong>IN WITNESS WHEREOF</strong>, the Parties have executed this Agreement to be effective on the date, month, and year first written above.</p>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-line">Owner Signature</div>
            <div style="margin-top:6px; color:#6b7280; font-size:12px;">${owner || ''}</div>
          </div>
          <div class="sign-box">
            <div class="sign-line">Tenant Signature</div>
            <div style="margin-top:6px; color:#6b7280; font-size:12px;">${tenantName}</div>
          </div>
        </div>

        <div class="footer-note">Generated via ManageYourPG</div>
      </div>

      <div class="bottom-footer">
        ${pg} &nbsp;|&nbsp; ${pgAddr}
      </div>
    </body>
    </html>
  `;
};

export const buildApplicationFormHtml = (tenant, photos = {}, pgInfo = {}, logoBase64 = '') => {
  const pg = pgInfo || {};
  const pgName = pg.name || 'Your PG';
  const pgAddress = pg.address || 'Address Line, City, State';
  const pgPhone = pg.phone || '+91 XXXXX XXXXX';
  const pgEmail = pg.email || 'pg@email.com';
  const joiningDate = formatDateShort(tenant.createdAt || tenant.joiningDate || tenant.checkInDate);
  const joiningTime = formatTime(tenant.createdAt || tenant.joiningDate || tenant.checkInDate);
  const refNo = `PG-CIF-${String(tenant._id || tenant.id || '').slice(-6).toUpperCase()}`;
  const aadhaar = tenant.aadhaar || tenant.aadharNumber || '';
  const aadhaarMasked = aadhaar
    ? aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
    : 'XXXX XXXX XXXX';
  const roomNo = tenant.roomNumber || tenant.room_number || '';
  const bedNo = tenant.bedNumber || tenant.bed_number || '';
  const roomBedDisplay = roomNo && bedNo ? `${roomNo} / Bed ${bedNo}` : roomNo || bedNo || '—';
  const tenantPhotoUrl = tenant.userPhoto || tenant.passportPhoto || '';
  const aadhaarPhotoUrl = tenant.govtIdFront || tenant.aadhaarPhoto || tenant.idProof || tenant.id_proof || '';
  const logoHtml = logoBase64 ? getLogoHtml(logoBase64, 44) : '';

  const tenantPhotoHtml = photos.tenantPhotoBase64
    ? getImageHtml(photos.tenantPhotoBase64, 'width:100%;height:100%;object-fit:cover;')
    : tenantPhotoUrl
      ? `<img src="${tenantPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<span style="font-size:8px;color:#94a3b8;text-align:center;padding:8px">Passport<br/>Photo</span>`;
  const aadhaarPhotoHtml = photos.aadhaarPhotoBase64
    ? getImageHtml(photos.aadhaarPhotoBase64, 'width:100%;height:100%;object-fit:cover;')
    : aadhaarPhotoUrl
      ? `<img src="${aadhaarPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<span style="font-size:8px;color:#94a3b8;text-align:center;padding:8px">Aadhaar<br/>Image</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
.page { width: 100%; max-width: 800px; margin: 0 auto; padding: 0; background: #fff; position: relative; overflow: hidden; }
.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 72px; font-weight: 800; color: rgba(26,26,78,0.04); white-space: nowrap; pointer-events: none; z-index: 0; letter-spacing: 4px; }
.header { background: #1a1a4e; padding: 18px 24px 14px; display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
.header-left { display: flex; align-items: center; gap: 14px; }
.pg-name { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.3px; margin-bottom: 3px; }
.pg-meta { font-size: 9px; color: rgba(255,255,255,0.65); line-height: 1.6; }
.header-right { text-align: right; color: rgba(255,255,255,0.9); }
.form-title { font-size: 13px; font-weight: 700; color: #fff; }
.form-subtitle { font-size: 9px; color: rgba(255,255,255,0.6); margin-top: 2px; }
.meta-bar { background: #f8faff; border-bottom: 1px solid #e2e8f0; padding: 7px 24px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap; position: relative; z-index: 1; font-size: 9.5px; }
.meta-item { display: flex; align-items: center; gap: 5px; }
.meta-label { color: #64748b; font-weight: 500; }
.meta-value { color: #1a1a2e; font-weight: 700; }
.meta-bar-right { margin-left: auto; color: #64748b; font-size: 9px; font-style: italic; }
.body { padding: 16px 24px; position: relative; z-index: 1; }
.section { margin-bottom: 14px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1.5px solid #e2e8f0; }
.section-number { width: 20px; height: 20px; border-radius: 6px; background: #1a1a4e; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.section-title { font-size: 11px; font-weight: 700; color: #1a1a2e; letter-spacing: 0.3px; text-transform: uppercase; }
.grid { display: grid; gap: 8px; }
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.field { display: flex; flex-direction: column; gap: 3px; }
.field.span-2 { grid-column: span 2; }
.field.span-3 { grid-column: span 3; }
.field-label { font-size: 8.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
.field-label .req { color: #ef4444; }
.field-value { font-size: 11px; font-weight: 500; color: #1a1a2e; border-bottom: 1px solid #cbd5e1; padding: 4px 0 3px; min-height: 22px; line-height: 1.3; }
.field-value.empty { color: #94a3b8; font-style: italic; font-weight: 400; }
.field-value.highlighted { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 5px; padding: 4px 8px; color: #1e40af; font-weight: 600; }
.photo-area { display: flex; justify-content: flex-end; margin-bottom: -10px; margin-top: -4px; }
.photo-wrapper { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.photo-box { width: 90px; height: 110px; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #f8faff; display: flex; align-items: center; justify-content: center; }
.photo-box img { width: 100%; height: 100%; object-fit: cover; }
.photo-label { font-size: 8px; color: #64748b; text-align: center; line-height: 1.4; font-weight: 500; }
.aadhaar-row { display: flex; gap: 16px; align-items: flex-start; margin-top: 8px; }
.aadhaar-photo-box { width: 160px; height: 100px; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #f8faff; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.aadhaar-photo-box img { width: 100%; height: 100%; object-fit: cover; }
.aadhaar-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 9px; font-weight: 700; }
.status-approved { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.status-pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
.checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 8px; }
.check-item { display: flex; align-items: center; gap: 7px; padding: 5px 8px; background: #f8faff; border: 0.5px solid #e2e8f0; border-radius: 6px; font-size: 9.5px; color: #374151; }
.check-box { width: 14px; height: 14px; border: 1.5px solid #cbd5e1; border-radius: 3px; flex-shrink: 0; background: #fff; }
.declaration { background: #f8faff; border: 0.5px solid #bfdbfe; border-left: 3px solid #2d2d7e; border-radius: 0 6px 6px 0; padding: 10px 12px; font-size: 9.5px; color: #374151; line-height: 1.6; margin: 12px 0 14px; }
.sig-row { display: flex; justify-content: space-between; margin-top: 10px; gap: 20px; }
.sig-block { flex: 1; text-align: center; }
.sig-line { border-top: 1px solid #94a3b8; margin-top: 30px; padding-top: 5px; font-size: 9px; color: #64748b; font-weight: 500; }
.sig-sub { font-size: 8.5px; color: #94a3b8; margin-top: 2px; }
.page-footer { background: #1a1a2e; padding: 7px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.footer-left { color: rgba(255,255,255,0.6); font-size: 8px; }
.footer-center { color: rgba(255,255,255,0.9); font-size: 8.5px; font-weight: 600; }
.footer-right { color: rgba(255,255,255,0.6); font-size: 8px; }
.terms-body { padding: 16px 24px 60px; position: relative; z-index: 1; }
.terms-intro { background: #eff6ff; border: 0.5px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; font-size: 9.5px; color: #1e40af; margin-bottom: 14px; font-style: italic; }
.terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
.term-item { padding: 8px 0; border-bottom: 0.5px solid #f1f5f9; }
.term-title { font-size: 10px; font-weight: 700; color: #1a1a2e; margin-bottom: 3px; display: flex; align-items: baseline; gap: 5px; }
.term-num { font-size: 8px; font-weight: 700; color: #fff; background: #1a1a4e; border-radius: 3px; padding: 1px 5px; flex-shrink: 0; }
.term-text { font-size: 9px; color: #475569; line-height: 1.6; }
.tenant-ack { background: #f8faff; border: 0.5px solid #bfdbfe; border-left: 3px solid #22c55e; border-radius: 0 6px 6px 0; padding: 10px 12px; font-size: 9.5px; color: #374151; line-height: 1.6; margin: 14px 0; }
</style>
</head>
<body>

<div class="page">
  <div class="watermark">CONFIDENTIAL</div>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div class="pg-details">
        <div class="pg-name">${pgName}</div>
        <div class="pg-meta">${pgAddress}<br/>Ph: ${pgPhone} &nbsp;|&nbsp; ${pgEmail}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="form-title">TENANT CHECK-IN FORM</div>
      <div class="form-subtitle">Complete all <span style="color:#f87171">*</span> fields before submission</div>
    </div>
  </div>

  <div class="meta-bar">
    <div class="meta-item"><span class="meta-label">REF NO:</span><span class="meta-value">${refNo}</span></div>
    <div class="meta-item"><span class="meta-label">CHECK-IN DATE:</span><span class="meta-value">${joiningDate}</span></div>
    <div class="meta-item"><span class="meta-label">CHECK-IN TIME:</span><span class="meta-value">${joiningTime}</span></div>
    <div class="meta-item"><span class="meta-label">STATUS:</span><span class="status-badge ${(tenant.status || '').toUpperCase() === 'APPROVED' ? 'status-approved' : 'status-pending'}">● ${(tenant.status || 'PENDING').toUpperCase()}</span></div>
    <div class="meta-bar-right">Page 1 of 2 &nbsp;|&nbsp; Confidential — For internal PG records only</div>
  </div>

  <div class="body">
    <div class="photo-area">
      <div class="photo-wrapper">
        <div class="photo-box">${tenantPhotoHtml}</div>
        <div class="photo-label">PASSPORT SIZE<br/>PHOTO 3.5×4.5 cm</div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-number">1</div><div class="section-title">Personal Details</div></div>
      <div class="grid grid-3" style="margin-bottom:8px">
        <div class="field span-2"><div class="field-label">Full Name <span class="req">*</span></div><div class="field-value">${tenant.name || ''}</div></div>
        <div class="field"><div class="field-label">Phone Number <span class="req">*</span></div><div class="field-value">${tenant.phone || ''}</div></div>
      </div>
      <div class="grid grid-3" style="margin-bottom:8px">
        <div class="field span-2"><div class="field-label">Email Address</div><div class="field-value">${tenant.email || ''}</div></div>
        <div class="field"><div class="field-label">Alternate Contact</div><div class="field-value">${tenant.altPhone || tenant.alt_phone || ''}</div></div>
      </div>
      <div class="grid grid-4">
        <div class="field"><div class="field-label">Occupation <span class="req">*</span></div><div class="field-value">${tenant.occupation || ''}</div></div>
        <div class="field span-2"><div class="field-label">Company / Institution / College</div><div class="field-value">${tenant.occupationAddress || tenant.occupation_address || ''}</div></div>
        <div class="field"><div class="field-label">Gender</div><div class="field-value empty">—</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-number">2</div><div class="section-title">Identity Verification</div></div>
      <div class="aadhaar-row">
        <div>
          <div class="field-label" style="margin-bottom:6px">AADHAAR CARD COPY <span class="req">*</span></div>
          <div class="aadhaar-photo-box">${aadhaarPhotoHtml}</div>
        </div>
        <div class="aadhaar-fields">
          <div class="field"><div class="field-label">ID Type <span class="req">*</span></div><div class="field-value">Aadhaar</div></div>
          <div class="field"><div class="field-label">Aadhaar Number <span class="req">*</span></div><div class="field-value highlighted">${aadhaarMasked}</div></div>
          <div class="field span-2" style="grid-column:span 2"><div class="field-label">Permanent / Home Address <span class="req">*</span></div><div class="field-value">${tenant.permanentAddress || tenant.permanent_address || tenant.address || ''}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-number">3</div><div class="section-title">Stay Details</div></div>
      <div class="grid grid-4">
        <div class="field"><div class="field-label">Room / Bed No. <span class="req">*</span></div><div class="field-value">${roomBedDisplay}</div></div>
        <div class="field"><div class="field-label">Check-In Date <span class="req">*</span></div><div class="field-value">${joiningDate}</div></div>
        <div class="field"><div class="field-label">Monthly Rent (₹) <span class="req">*</span></div><div class="field-value">${tenant.monthlyRent || tenant.rent || '—'}</div></div>
        <div class="field"><div class="field-label">Security Deposit (₹) <span class="req">*</span></div><div class="field-value">${tenant.securityDeposit || tenant.deposit || tenant.advanceAmount || '—'}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-number">4</div><div class="section-title">Emergency Contact</div></div>
      <div class="grid grid-3">
        <div class="field"><div class="field-label">Contact Name <span class="req">*</span></div><div class="field-value">${tenant.fatherName || tenant.motherName || tenant.guardianName || '—'}</div></div>
        <div class="field"><div class="field-label">Relationship</div><div class="field-value empty">—</div></div>
        <div class="field"><div class="field-label">Contact Phone <span class="req">*</span></div><div class="field-value">${tenant.fatherPhone || tenant.motherPhone || tenant.guardianPhone || tenant.altPhone || ''}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-number">5</div><div class="section-title">Check-In Checklist — Completed by Manager</div></div>
      <div class="checklist">
        <div class="check-item"><div class="check-box"></div>ID copy collected &amp; verified</div>
        <div class="check-item"><div class="check-box"></div>Passport-size photo received &amp; filed</div>
        <div class="check-item"><div class="check-box"></div>Rent agreement signed by tenant</div>
        <div class="check-item"><div class="check-box"></div>Security deposit receipt issued</div>
        <div class="check-item"><div class="check-box"></div>Room / bed inspection completed</div>
        <div class="check-item"><div class="check-box"></div>House rules explained &amp; acknowledged</div>
        <div class="check-item"><div class="check-box"></div>Emergency contact recorded</div>
        <div class="check-item"><div class="check-box"></div>WiFi credentials / key handed over</div>
        <div class="check-item"><div class="check-box"></div>Tenant onboarded in app system</div>
        <div class="check-item"><div class="check-box"></div>Welcome kit / orientation provided</div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-number">6</div><div class="section-title">Declaration &amp; Signatures</div></div>
      <div class="declaration">
        I declare that all information provided above is true and complete. I agree to abide by the rules
        and regulations of this PG accommodation. I understand that misrepresentation may lead to immediate
        termination of tenancy without refund of deposit. Signing this form confirms acceptance of all
        Terms &amp; Conditions on Page 2.
      </div>
      <div class="sig-row">
        <div class="sig-block"><div class="sig-line">Tenant Signature</div><div class="sig-sub">${tenant.name || 'Full Name'} &amp; Date</div></div>
        <div class="sig-block"><div class="sig-line">Manager / Owner Signature</div><div class="sig-sub">Name, Designation &amp; Date</div></div>
        <div class="sig-block"><div class="sig-line">Witness Signature</div><div class="sig-sub">Name &amp; Date</div></div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="footer-left">Powered by Codex Tech Innovations &amp; Consultants LLP</div>
    <div class="footer-center">${pgName} — PG Management Platform</div>
    <div class="footer-right">Page 1 of 2 &nbsp;|&nbsp; ${refNo}</div>
  </div>
</div>

<div class="page">
  <div class="watermark">CONFIDENTIAL</div>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div class="pg-details">
        <div class="pg-name">${pgName}</div>
        <div class="pg-meta">${pgAddress}<br/>Ph: ${pgPhone} &nbsp;|&nbsp; ${pgEmail}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="form-title">TERMS &amp; CONDITIONS</div>
      <div class="form-subtitle">Read carefully — signing Page 1 implies acceptance</div>
    </div>
  </div>

  <div class="meta-bar">
    <div class="meta-item"><span class="meta-label">REF NO:</span><span class="meta-value">${refNo}</span></div>
    <div class="meta-item"><span class="meta-label">CHECK-IN DATE:</span><span class="meta-value">${joiningDate}</span></div>
    <div class="meta-item"><span class="meta-label">TENANT:</span><span class="meta-value">${tenant.name || '—'}</span></div>
    <div class="meta-bar-right">Page 2 of 2 &nbsp;|&nbsp; Confidential — For internal PG records only</div>
  </div>

  <div class="terms-body">
    <div class="terms-intro">Signing the check-in form (Page 1) constitutes full acceptance of these terms and conditions of residency.</div>

    <div class="section-header"><div class="section-number" style="background:#064e3b">T</div><div class="section-title">Terms &amp; Conditions of Residency</div></div>
    <div class="terms-grid">
      <div class="term-item"><div class="term-title"><span class="term-num">1</span> Rent &amp; Payment</div><div class="term-text">Monthly rent is due on or before the 5th of each calendar month. A late fee of ₹50/day applies thereafter. Accepted modes: UPI, bank transfer, or approved digital channels. Two months of non-payment may result in termination.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">2</span> Security Deposit</div><div class="term-text">A refundable deposit is collected at check-in and refunded within 15 business days of vacating, after deducting outstanding dues or damages. It does not substitute for rent and no interest is payable.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">3</span> Notice Period &amp; Vacating</div><div class="term-text">A minimum 30-day written notice is required before vacating. Inadequate notice results in forfeiture of one month's rent from the deposit. Vacate by 12:00 noon on the last day and return all keys and access items.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">4</span> Check-In &amp; Check-Out Timings</div><div class="term-text">Standard check-in: 10:00 AM – 8:00 PM. Check-out: before 12:00 noon. Early check-in or late check-out requires prior written approval and may attract additional charges.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">5</span> House Rules &amp; Conduct</div><div class="term-text">Residents must maintain decorum and respect for co-residents and staff. Noise must be minimal between 10:00 PM and 7:00 AM. Smoking, alcohol, and prohibited substances are strictly not allowed.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">6</span> Visitors &amp; Guests</div><div class="term-text">Visitors are permitted only in designated common areas and must register at reception. No overnight guests without prior written approval from management. Residents are fully responsible for guest behaviour.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">7</span> Maintenance &amp; Property Care</div><div class="term-text">Damage beyond normal wear and tear will be charged to the resident. Maintenance requests must be submitted via the PG app or in writing. No alterations or modifications without written consent.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">8</span> Privacy &amp; Safety</div><div class="term-text">Management may inspect rooms with 24-hour prior notice. Emergency entry may occur without notice. Tampering with CCTV, security systems, or fire safety equipment is strictly prohibited.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">9</span> Utilities &amp; Amenities</div><div class="term-text">Electricity, water, and WiFi are subject to fair usage policies. Excess usage will be billed at actuals. Management may revise utility inclusions with 30 days' prior notice.</div></div>
      <div class="term-item"><div class="term-title"><span class="term-num">10</span> Liability &amp; Governing Law</div><div class="term-text">Management is not liable for loss or theft of personal belongings. These terms are governed by Indian law. Disputes shall be resolved through mutual discussion or arbitration under the Arbitration and Conciliation Act, 1996.</div></div>
    </div>

    <div class="tenant-ack">
      I have read, understood, and agree to abide by all Terms &amp; Conditions stated above. I acknowledge that
      violation of any clause may result in termination of tenancy and / or forfeiture of the security deposit
      as deemed appropriate by the PG management.
    </div>

    <div class="sig-row">
      <div class="sig-block"><div class="sig-line">Tenant Signature</div><div class="sig-sub">${tenant.name || 'Full Name'} &amp; Date</div></div>
      <div class="sig-block"><div class="sig-line">Authorised Signatory</div><div class="sig-sub">Name, Designation &amp; Official Stamp</div></div>
    </div>
  </div>

  <div class="page-footer">
    <div class="footer-left">Powered by Codex Tech Innovations &amp; Consultants LLP</div>
    <div class="footer-center">${pgName} — PG Management Platform</div>
    <div class="footer-right">Page 2 of 2 &nbsp;|&nbsp; ${refNo}</div>
  </div>
</div>

</body>
</html>`;
};

export const buildPropertyRulesHtml = (tenant, pgInfo, logoBase64) => {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const rulesHtml = DEFAULT_RULES.map((rule, index) => `<p>${index + 1}. ${rule}</p>`).join('');
  const logoHtml = logoBase64 ? getLogoHtml(logoBase64, 44) : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
        .header { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px; }
        h1 { text-align: center; color: #1a1a4e; margin-bottom: 6px; }
        .sub { text-align: center; color: #6b7280; margin-bottom: 24px; font-size: 14px; }
        .details { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .details td { padding: 10px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
        .details td:first-child { background: #f9fafb; font-weight: 600; width: 35%; }
        .rules { margin-bottom: 30px; }
        .rules h3 { color: #1a1a4e; margin-bottom: 12px; font-size: 16px; }
        .rules p { margin: 0 0 10px 0; text-align: justify; }
        .declaration { background: #f9fafb; border-left: 4px solid #1a1a4e; padding: 16px; margin-bottom: 30px; border-radius: 0 8px 8px 0; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .sign-box { width: 45%; text-align: center; }
        .sign-line { border-top: 1px solid #1f2937; margin-top: 50px; padding-top: 8px; font-weight: 600; }
        .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoHtml}
        <h1>PROPERTY RULES & REGULATIONS</h1>
      </div>
      <div class="sub">${pgInfo.name || 'PG Accommodation'}</div>

      <table class="details">
        <tr><td>Tenant Name</td><td>${tenant.name || tenant.tenantName || ''}</td></tr>
        <tr><td>Phone Number</td><td>${tenant.phone || ''}</td></tr>
        <tr><td>Room Number</td><td>${tenant.roomNumber || ''}</td></tr>
        <tr><td>Date</td><td>${today}</td></tr>
      </table>

      <div class="rules">
        <h3>House Rules</h3>
        ${rulesHtml}
      </div>

      <div class="declaration">
        I, <strong>${tenant.name || tenant.tenantName || ''}</strong>, hereby acknowledge that I have read, understood, and agree to abide by all the above property rules and regulations. I understand that violation of these rules may result in penalties or termination of tenancy.
      </div>

      <div class="signatures">
        <div class="sign-box">
          <div class="sign-line">Tenant Signature</div>
        </div>
        <div class="sign-box">
          <div class="sign-line">Owner / Manager Signature</div>
        </div>
      </div>

      <div class="footer">Generated via ManageYourPG</div>
    </body>
    </html>
  `;
};

export const buildIdCardHtml = (tenant, pgName, pgLogoUrl) => {
  const tenantId = String(tenant._id).slice(-8).toUpperCase();
  const issuedOn = formatDateShort(tenant.checkInDate || tenant.checkinDate);
  const aadhaarFmt = tenant.aadhaar
    ? tenant.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
    : 'XXXX XXXX XXXX';
  const photoUrl = tenant.passportPhoto || tenant.userPhoto || tenant.id_proof || '';
  const displayPgName = pgName || 'Your PG';

  const pgLogoHtml = pgLogoUrl
    ? `<img src="${pgLogoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`
    : `<div style="position:absolute;bottom:0;left:0;right:0;height:42%;background:linear-gradient(135deg,#22c55e,#15803d);opacity:0.9;clip-path:polygon(0 60%,100% 20%,100% 100%,0 100%);"></div><span style="color:#fff;font-size:13px;font-weight:800;letter-spacing:-0.5px;position:relative;z-index:1;">PG</span>`;

  const checkin = tenant.checkinDate || tenant.checkInDate || tenant.joining_date || new Date();
  const months = tenant.stayMonths || 11;
  const validDate = new Date(checkin);
  validDate.setMonth(validDate.getMonth() + months);
  const validUntil = formatDateShort(validDate);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; padding: 16px; display: flex; justify-content: center; }
        .wrapper { display: flex; flex-direction: column; gap: 20px; align-items: center; width: 100%; max-width: 360px; }
        .card { width: 100%; max-width: 330px; aspect-ratio: 330 / 510; border-radius: 20px; overflow: hidden; position: relative; box-shadow: 0 20px 60px rgba(26,26,78,0.25), 0 4px 16px rgba(0,0,0,0.1); }
        .front { background: #ffffff; display: flex; flex-direction: column; }
        .front-header { background: linear-gradient(135deg, #1a1a4e 0%, #2d2d7e 50%, #1e3a8a 100%); padding: 18px 18px 14px; position: relative; overflow: hidden; flex-shrink: 0; }
        .front-header::before { content: ''; position: absolute; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.05); top: -60px; right: -40px; }
        .front-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6); }
        .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; position: relative; z-index: 1; }
        .logo-box { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05)); flex-shrink: 0; }
        .pg-title-wrap { flex: 1; padding: 0 10px; }
        .pg-title { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: -0.3px; }
        .pg-sub { color: rgba(255,255,255,0.55); font-size: 9px; font-weight: 500; margin-top: 1px; }
        .active-badge { background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.5); color: #4ade80; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px; white-space: nowrap; }
        .id-card-label { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 6px; padding: 5px 12px; position: relative; z-index: 1; }
        .id-card-label-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
        .id-card-label-text { color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
        .front-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px 18px 0; }
        .photo-ring { width: 100px; height: 100px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #22c55e, #3b82f6, #8b5cf6); flex-shrink: 0; margin-bottom: 10px; }
        .photo-inner { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; border: 2px solid #fff; background: #f1f5f9; }
        .photo-inner img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #94a3b8; }
        .tenant-name { font-size: 16px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.4px; text-align: center; margin-bottom: 2px; }
        .tenant-occ { font-size: 10px; font-weight: 500; color: #64748b; text-align: center; margin-bottom: 14px; }
        .details-grid { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .detail-item { background: #f8faff; border: 0.5px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; }
        .detail-item.accent { background: #eff6ff; border-color: #bfdbfe; }
        .detail-item.full { grid-column: span 2; }
        .detail-label { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .detail-value { font-size: 11px; font-weight: 600; color: #1a1a2e; }
        .detail-value.blue { color: #1e40af; }
        .back { background: linear-gradient(155deg, #0d0d2e 0%, #1a1a4e 40%, #1e3a8a 100%); display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .back::before { content: ''; position: absolute; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.03); top: -100px; right: -80px; }
        .back::after { content: ''; position: absolute; width: 200px; height: 200px; border-radius: 50%; background: rgba(34,197,94,0.07); bottom: -60px; left: -40px; }
        .accent-bar { height: 3px; background: linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6); flex-shrink: 0; }
        .back-header { padding: 16px 18px 12px; border-bottom: 0.5px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; position: relative; z-index: 1; }
        .back-title { color: #fff; font-size: 13px; font-weight: 700; }
        .back-sub { color: rgba(255,255,255,0.45); font-size: 9px; margin-top: 1px; }
        .back-body { flex: 1; padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 1; overflow: hidden; }
        .qr-row { display: flex; align-items: center; gap: 14px; }
        .qr-box { background: #fff; border-radius: 12px; padding: 6px; flex-shrink: 0; }
        .qr-placeholder { width: 90px; height: 90px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #1a1a2e; }
        .qr-info { flex: 1; }
        .qr-title { color: #fff; font-size: 11px; font-weight: 700; margin-bottom: 4px; }
        .qr-detail { color: rgba(255,255,255,0.55); font-size: 9.5px; line-height: 1.7; }
        .back-section-title { color: rgba(255,255,255,0.5); font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .back-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .back-info-item { background: rgba(255,255,255,0.07); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 10px; }
        .back-info-item.full { grid-column: span 2; }
        .back-info-label { font-size: 7.5px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .back-info-value { font-size: 10px; font-weight: 600; color: #fff; }
        .footer-strip { background: rgba(0,0,0,0.2); padding: 10px 18px; text-align: center; position: relative; z-index: 1; }
        .footer-text { color: rgba(255,255,255,0.5); font-size: 8px; font-weight: 500; }
        .id-number { color: rgba(255,255,255,0.9); font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-top: 2px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card front">
          <div class="front-header">
            <div class="header-top">
              <div class="logo-box">${pgLogoHtml}</div>
              <div class="pg-title-wrap">
                <div class="pg-title">${displayPgName}</div>
                <div class="pg-sub">Resident ID Card</div>
              </div>
              <div class="active-badge">ACTIVE</div>
            </div>
            <div class="id-card-label"><div class="id-card-label-dot"></div><div class="id-card-label-text">ID Card</div></div>
          </div>
          <div class="front-body">
            <div class="photo-ring">
              <div class="photo-inner">
                ${photoUrl ? `<img src="${photoUrl}" alt="photo" />` : '<div class="photo-placeholder">👤</div>'}
              </div>
            </div>
            <div class="tenant-name">${tenant.name || ''}</div>
            <div class="tenant-occ">${tenant.occupation || 'Resident'}</div>
            <div class="details-grid">
              <div class="detail-item"><div class="detail-label">ID Number</div><div class="detail-value blue">${tenantId}</div></div>
              <div class="detail-item"><div class="detail-label">Room</div><div class="detail-value">${tenant.roomNumber || tenant.room_number || '—'}</div></div>
              <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${tenant.phone || '—'}</div></div>
              <div class="detail-item"><div class="detail-label">Aadhaar</div><div class="detail-value">${aadhaarFmt}</div></div>
              <div class="detail-item accent full"><div class="detail-label">Valid Until</div><div class="detail-value blue">${validUntil}</div></div>
            </div>
          </div>
        </div>
        <div class="card back">
          <div class="accent-bar"></div>
          <div class="back-header">
            <div>
              <div class="back-title">${displayPgName}</div>
              <div class="back-sub">Resident Authentication</div>
            </div>
            <div class="active-badge">VERIFIED</div>
          </div>
          <div class="back-body">
            <div class="qr-row">
              <div class="qr-box"><div class="qr-placeholder">QR</div></div>
              <div class="qr-info">
                <div class="qr-title">Scan to Verify</div>
                <div class="qr-detail">This card is issued to authorized residents only. If found, please return to the PG office.</div>
              </div>
            </div>
            <div>
              <div class="back-section-title">Contact Details</div>
              <div class="back-info-grid">
                <div class="back-info-item full"><div class="back-info-label">Address</div><div class="back-info-value">${pgInfo.address || ''}</div></div>
                <div class="back-info-item"><div class="back-info-label">Issued On</div><div class="back-info-value">${issuedOn}</div></div>
                <div class="back-info-item"><div class="back-info-label">Emergency</div><div class="back-info-value">${tenant.fatherPhone || tenant.motherPhone || tenant.guardianPhone || tenant.altPhone || '—'}</div></div>
              </div>
            </div>
            <div>
              <div class="back-section-title">Terms</div>
              <div class="back-info-grid">
                <div class="back-info-item full"><div class="back-info-value" style="font-size:9px;color:rgba(255,255,255,0.7);line-height:1.6;">This card must be carried at all times. Tampering or misuse will result in disciplinary action. Report loss immediately.</div></div>
              </div>
            </div>
          </div>
          <div class="footer-strip">
            <div class="footer-text">Powered by ManageYourPG</div>
            <div class="id-number">ID: ${tenantId}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
