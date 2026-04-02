export default function PizzaControlsBtns({ 
  downloadSnapshot,
  handlePublish,
  handleSaveToProfile,
  removeAllToppings,
}) {
  return (
    <div  className="config-btn-container"  >  
 
   
      {/* Buttons */}
      <div className="config-btn" >
        <div className="btn-box" ><button onClick={() => downloadSnapshot(true)}><img   src="/icons/camera.svg" alt="printscreen" /><p>Print</p></button></div>
    <div className="btn-box" > <button onClick={handleSaveToProfile}><img   src="/icons/save.svg" alt="save" /><p>Guardar</p></button></div>
         <div className="btn-box" > <button onClick={removeAllToppings}><img   src="/icons/delete.svg" alt="clear" /><p>Apagar</p></button></div>
       <div className="btn-box send-btn" > <button onClick={handlePublish}><p>Publicar</p><img   src="/icons/send.svg" alt="publish" /></button></div>
     
       
   
    </div>
    </div>
  );
}
