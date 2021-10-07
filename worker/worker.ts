declare var self: ServiceWorkerGlobalScope;

self.addEventListener( 'message', ( evt ) => {
    let img = new ImageData( evt.data.width, evt.data.height );
    img.data.set( new Uint8ClampedArray( evt.data.pixels ) );
  
    for( let x = 0; x < img.data.length; x += evt.data.channels ) {
      let average = ( 
        img.data[x] +
        img.data[x + 1] +
        img.data[x + 2]
      ) / 3;
      
      img.data[x] = average;
      img.data[x + 1] = average;
      img.data[x + 2] = average;
    }
  
    let bytes = new Uint8ClampedArray( img.data );
  
    self.postMessage( {
      type: 'end',
      bytes: bytes
    }, [bytes.buffer] );
    
    // self.postMessage( img.data.buffer, [img.data.buffer] );
  } );
  