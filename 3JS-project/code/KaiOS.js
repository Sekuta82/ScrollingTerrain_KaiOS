var MODULE = (function (app) {	

	//input mapping
	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('keyup', handleKeyup);
	
	function handleKeydown (e) {
		switch(e.key) {
			case 'ArrowUp':
			case '2': /* num pad navigation */
				app.keyCallbackDown.dUp();
				break;
			case 'ArrowDown':
			case '8': /* num pad navigation */
				app.keyCallbackDown.dDown();
				break;
			case 'ArrowLeft': 
			case '4': /* num pad navigation */
				app.keyCallbackDown.dLeft();
				break;
			case 'ArrowRight':
			case '6': /* num pad navigation */
				app.keyCallbackDown.dRight();
				break;
		}
	}
	function handleKeyup (e) {
		switch(e.key) {
			case 'ArrowUp':
			case '2': /* num pad navigation */
				app.keyCallbackUp.dUp();
				break;
			case 'ArrowDown':
			case '8': /* num pad navigation */
				app.keyCallbackUp.dDown();
				break;
			case 'ArrowLeft': 
			case '4': /* num pad navigation */
				app.keyCallbackUp.dLeft();
				break;
			case 'ArrowRight':
			case '6': /* num pad navigation */
				app.keyCallbackUp.dRight();
				break;
			case 'SoftLeft':
			case 'Control': /* use on PC */
				app.keyCallbackUp.softLeft();
				break;
			case 'SoftRight':
			case 'Alt': /* use on PC */
				app.keyCallbackUp.softRight();
				break;
		}
	}


	return app;
}(MODULE))