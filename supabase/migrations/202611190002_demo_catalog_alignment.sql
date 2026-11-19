begin;
-- Keep the illustrative catalog consistent with the existing Expo doctor IDs.
update public.clinic_doctors set name='BS. CKII. Nguyễn Văn Minh',specialty='Tim mạch',hospital='BV. Đại học Y Dược TP.HCM' where id='doc-2';
update public.clinic_doctors set name='ThS. BS. Nguyễn Minh Đức',specialty='Mắt',hospital='BV. Mắt TP.HCM' where id='doc-3';
update public.clinic_doctors set name='PGS. BS. Trần Anh Tuấn',specialty='Thần kinh',hospital='Bệnh viện Chợ Rẫy' where id='doc-4';
commit;
