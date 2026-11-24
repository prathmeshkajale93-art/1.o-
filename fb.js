import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signInAnonymously,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,collection,onSnapshot,setDoc,updateDoc,addDoc,getDoc,query,where} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),fs=getFirestore(app);
const log=e=>console.warn("Firestore:",e.code||e);

export const db={
  doc:p=>({
    onSnapshot:(f,e)=>onSnapshot(doc(fs,p),s=>f({data:()=>s.data()}),e||log),
    set:d=>setDoc(doc(fs,p),d),
    update:d=>updateDoc(doc(fs,p),d)
  }),
  collection:(p,w)=>({
    add:d=>addDoc(collection(fs,p),d),
    onSnapshot:(f,e)=>onSnapshot(w?query(collection(fs,p),where(...w)):collection(fs,p),s=>f({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()}))}),e||log)
  })
};
export const ready=()=>new Promise(r=>{const u=onAuthStateChanged(auth,x=>{u();r(x)})});
export const guestSignIn=async()=>auth.currentUser||(await signInAnonymously(auth)).user;
export const login=(email,pw)=>signInWithEmailAndPassword(auth,email,pw);
export const logout=()=>signOut(auth);
export const token=async()=>(auth.currentUser||await guestSignIn()).getIdToken();
export const getProfile=async u=>{const s=await getDoc(doc(fs,"users/"+u.uid));return s.exists()?{id:u.uid,...s.data()}:null};
