<?PHP
//---------------------------------------------------------------------
// FILE: push.php
// AUTHOR: Klemen Kenda
// DESCRIPTION: Archive Push script
// DATE: 01/12/2013
// HISTORY:
//---------------------------------------------------------------------

// initialization 
// DEBUG
error_reporting(E_ALL & ~E_NOTICE);
ini_set("display_errors", 1);

// get request variables
// import_request_variables("gPC");
extract($_GET); extract($_POST); extract($_COOKIE);

// includes
include("inc/http.inc.php");
include("inc/config.inc.php");


function isJson($string) {
  json_decode($string);
  return (json_last_error() == JSON_ERROR_NONE);
}

function pushFile($filename) {
	global $miner; 
	
	$fp = fopen("./logs_push/" . $filename, "r");
		$i = 0;
	while (($JSON = fgets($fp, 4000000)) !== false) {
		$i++;
		// echo $JSON . "\n\n";
		// create request to EnStreaM
		if (isJSON($JSON)) {
		  $url = $miner["url"] . ":" . $miner["port"] . "/data/add-measurement?data=" . urlencode($JSON);
		  // uncomment to do the real push!
		  $HTML = getURL($url);		
		  echo $HTML . "\n\n";		  
		}
		echo $i . "           \r";
    }
     
    fclose($fp);		
}

// get log files from the logs folder
$dp = opendir("./logs_push");

// scan and push all log files
while (false !== ($entry = readdir($dp))) {
	if (is_file("./logs_push/" . $entry)) {
		echo "$entry ----------------------------------------\n";
		pushFile($entry);
	}	
}

closedir($dp);

?>
