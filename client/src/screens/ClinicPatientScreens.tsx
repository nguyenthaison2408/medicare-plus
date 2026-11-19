import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../theme';
import {DOCTORS} from '../data/mockData';
import type {DoctorItem,TimeSlotItem} from '../data/mockData';
import {useAppContext} from '../context/AppContext';
import {clinicRecord} from '../services/clinicAdapters';
import {cancelClinicAppointment, listClinicAppointments, loadClinicProfile, subscribeClinicAppointments,
  type ClinicAppointment, type ClinicProfile} from '../services/clinicCloud';

function useClinicData() {
  const [rows,setRows]=useState<ClinicAppointment[]>([]);
  const [profile,setProfile]=useState<ClinicProfile|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{
    try {
      const [nextProfile,nextRows]=await Promise.all([loadClinicProfile(),listClinicAppointments()]);
      setProfile(nextProfile);setRows(nextRows);setError('');
    } catch(cause) {setError(cause instanceof Error?cause.message:'Không tải được dữ liệu.');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{
    let mounted=true;
    void Promise.all([loadClinicProfile(),listClinicAppointments()]).then(([nextProfile,nextRows])=>{
      if(mounted){setProfile(nextProfile);setRows(nextRows);setError('');}
    }).catch(cause=>{if(mounted)setError(cause instanceof Error?cause.message:'Không tải được dữ liệu.');})
      .finally(()=>{if(mounted)setLoading(false);});
    const unsubscribe=subscribeClinicAppointments(()=>{void refresh();});
    return ()=>{mounted=false;unsubscribe();};
  },[refresh]);
  return {rows,profile,loading,error,refresh};
}
const doctorName=(row:ClinicAppointment)=>DOCTORS.find(doctor=>doctor.id===row.doctor_id)?.name||row.doctor_id;
const dateLabel=(row:ClinicAppointment)=>new Date(row.starts_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
const statuses={CONFIRMED:'Đã xác nhận',CHECKED_IN:'Đã tiếp đón',COMPLETED:'Đã hoàn thành',CANCELLED:'Đã hủy'};
function Action({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:0.5}]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
}
function Status({loading,error}:{loading:boolean;error:string}) {
  return <>{loading?<ActivityIndicator/>:null}{error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}</>;
}

export function ClinicPatientRecordsScreen() {
  const {rows,loading,error,refresh}=useClinicData();
  const records=rows.filter(row=>clinicRecord(row));
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.heading}>Bệnh án của tôi</Text>
    <Status loading={loading} error={error}/>
    <Action label="Tải lại bệnh án" onPress={()=>{void refresh();}}/>
    {!loading&&!records.length?<Text style={styles.copy}>Chưa có bệnh án được bác sĩ lưu.</Text>:null}
    {records.map(row=>{const record=clinicRecord(row)!;return <View key={row.id} style={styles.card}>
      <Text style={styles.title}>{doctorName(row)}</Text><Text>{dateLabel(row)}</Text>
      <Text style={styles.copy}>Chẩn đoán: {record.diagnosis}</Text>
      {record.medications.length?<Text style={styles.title}>Đơn thuốc</Text>:null}
      {record.medications.map((drug,index)=><Text key={index} style={styles.copy}>{drug.name} — {drug.dosage}</Text>)}
      {record.notes?<Text style={styles.copy}>Ghi chú: {record.notes}</Text>:null}
    </View>;})}
  </ScrollView>;
}

export function ClinicPatientAppointmentsScreen({onNavigate,onBookNew}:{onNavigate:(route:string)=>void;onBookNew:()=>void}) {
  const {selectBookingTicket}=useAppContext();
  const {rows,loading,error,refresh}=useClinicData();
  const [confirmId,setConfirmId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [actionError,setActionError]=useState('');
  const cancel=async(id:string)=>{
    if(busy)return;
    setBusy(true);setActionError('');
    try {await cancelClinicAppointment(id);setConfirmId(null);await refresh();}
    catch(cause){setActionError(cause instanceof Error?cause.message:'Chưa hủy được lịch.');}
    finally {setBusy(false);}
  };
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.heading}>Lịch khám của tôi</Text>
    <Action label="Đặt lịch mới" onPress={onBookNew}/>
    <Status loading={loading} error={error||actionError}/>
    {!loading&&!rows.length?<Text style={styles.copy}>Bạn chưa có lịch khám.</Text>:null}
    {rows.map(row=><View key={row.id} style={styles.card}>
      <Text style={styles.title}>{doctorName(row)}</Text><Text>{dateLabel(row)}</Text>
      <Text style={styles.copy}>{statuses[row.status]}</Text><Text selectable>{row.booking_code}</Text>
      {(row.status==='CONFIRMED'||row.status==='CHECKED_IN')?<>
        <Action label="Xem phiếu QR" onPress={()=>{selectBookingTicket(row);onNavigate('bookingSuccess');}}/>
        {confirmId===row.id?<>
          <Text style={styles.copy}>Xác nhận hủy lịch khám này?</Text>
          <Action label={busy?'Đang hủy…':'Xác nhận hủy lịch'} disabled={busy} onPress={()=>{void cancel(row.id);}}/>
          <Action label="Giữ lịch khám" disabled={busy} onPress={()=>setConfirmId(null)}/>
        </>:<Action label="Hủy lịch khám" disabled={busy} onPress={()=>setConfirmId(row.id)}/>}
      </>:null}
    </View>)}
  </ScrollView>;
}

export function ClinicPatientProfileScreen({onLogout}:{onLogout:()=>void}) {
  const {profile,loading,error}=useClinicData();
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.heading}>Tài khoản của tôi</Text><Status loading={loading} error={error}/>
    {profile?<View style={styles.card}>
      <Text style={styles.title}>{profile.full_name}</Text>
      <Text style={styles.copy}>Điện thoại: {profile.phone||'Chưa cập nhật'}</Text>
      <Text selectable>Mã tài khoản: {profile.id}</Text>
    </View>:null}
    <Action label="Đăng xuất" onPress={onLogout}/>
  </ScrollView>;
}
export function ClinicBookingConfirmationScreen({doctor,day,slot,onBack,onConfirm}:{
  doctor:DoctorItem;day?:{fullDate:string};slot?:TimeSlotItem;onBack:()=>void;onConfirm:()=>void|Promise<void>;
}) {
  const {patientProfile}=useAppContext();
  const [busy,setBusy]=useState(false);
  const submit=async()=>{if(busy||!day||!slot)return;setBusy(true);try{await onConfirm();}finally{setBusy(false);}};
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.heading}>Xác nhận lịch khám</Text>
    <View style={styles.card}>
      <Text style={styles.title}>{doctor.name}</Text><Text>{doctor.hospital}</Text>
      <Text style={styles.copy}>Bệnh nhân: {patientProfile.name}</Text>
      <Text style={styles.copy}>Ngày khám: {day?.fullDate||'Chưa chọn'}</Text>
      <Text style={styles.copy}>Giờ khám: {slot?.time||'Chưa chọn'}</Text>
      <Text style={styles.copy}>Thanh toán tại cơ sở y tế. Ứng dụng chưa thu tiền; viện phí và quyền lợi BHYT được đối soát tại quầy.</Text>
    </View>
    <Action label={busy?'Đang đặt lịch…':'Xác nhận đặt lịch'} disabled={busy||!day||!slot} onPress={()=>{void submit();}}/>
    <Action label="Chọn lại lịch" disabled={busy} onPress={onBack}/>
  </ScrollView>;
}
const styles=StyleSheet.create({
  page:{padding:20,gap:14,paddingBottom:40},heading:{fontSize:24,fontWeight:'700',color:COLORS.primary},
  card:{padding:16,gap:8,borderWidth:1,borderColor:COLORS.outlineVariant,borderRadius:14,backgroundColor:COLORS.surface},
  title:{fontSize:16,fontWeight:'700',color:COLORS.textPrimary},copy:{fontSize:15,lineHeight:22,color:COLORS.textSecondary},
  button:{padding:12,borderRadius:10,backgroundColor:COLORS.primary,alignItems:'center',marginTop:8},
  buttonText:{fontWeight:'700',color:'#fff'},error:{color:COLORS.error,padding:8},
});
