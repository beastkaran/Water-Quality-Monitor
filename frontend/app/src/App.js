import logo from './logo.svg';
import './App.css';
const validate = ()=>{

}
function App() {
  return (
    <div className="App">
      <input type='email' placeholder='enter ur email' required/>
      <input type='password' placeholder='enter ur password' required/>
      <button onClick={validate} >Submit</button>
    </div>
  );
}

export default App;
