# Progetto GreenMap
### Patrick Moling: 237877, Raffaele Cella: 237870, Matteo Magnaguagno: 244053
### Gruppo: 20
#

Link dei deliverable consegnati
+ [Primo deliverable](https://it.overleaf.com/read/bpnzjtwwtcwc#dd76b3)
+ [Secondo deliverable](https://www.overleaf.com/read/bvftkptnhqbt#e834a3)

In questa repository è presente
+ il file **green_map_documentation.yaml** che spiega le funzionalità RESTful offerte dal nostro servizio.
+ il file **server.js** che permette di eseguire il backend del nostro servizio.

Come avviare il server
+ navigare nella directory del progetto *.../GreenMap_Gruppo20*
+ inserire il comando *npm install* per installare tutte i moduli node richiesti.
+ inserire il comando *cd app* per entrare nella cartella *.../GreenMap_Gruppo20/app*
+ inserire il comando *npm install* per installare tutte i moduli node richiesti.
+ inserire il comando *npm run build* per creare la build del server VueJS.
+ inserire il comando *cd ..* per tornare nella directory base del progetto *.../GreenMap_Gruppo20*
+ inserire il comando *touch .env* per creare il file di configurazione
+ è necessario copiare il contenuto del file *.env.example*, incollarlo nel file *.env* e compilare il campo **DATABASE_URL** inserendo le proprie credenziali.
+ inserire il comando *npm run dev* per avviare il servizio backend del server.
+ in base alla porta scelta aprire il browser ed inserire *localhost:PORT* per interagire col servizio