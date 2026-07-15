Bitte erstelle in ./scripts ein shell script zum kopieren des minimalen sample Projektes an einen als parameter spezifizierten Ort
Diese Daten und Verzeichnisse sollen dan an den angegebenen ort kopiert werden.

.gitignore 
tsconfig.base.json
package.json
packages/*

Wenn es irgendeine der zu kopierenden dateien schon gibt, dann bitte das script mit einer entsprechenden fehlermeldung beenden ausser wenn --overwrite angegeben ist



Bitte wende nun das 


// UNUSED

Bitte erweitere scripts/copy-minimal-sample.sh nun auf folgende weise:
* es gibt ein neues op
* die richtung die kopiert werden soll