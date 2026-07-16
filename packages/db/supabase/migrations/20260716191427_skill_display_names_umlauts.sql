-- 0004_skill_display_names_umlauts.sql
-- Sync the skills.display_name column with the corrected umlaut spelling.
-- Migration 0003 was seeded with ae/oe/ue transliteration; user-facing text
-- must use real umlauts (ü, ä, ö, ß). Slugs stay ASCII.

update skills set display_name = 'Elektronik für Betriebstechnik'                where slug = 'elektronik-betriebstechnik';
update skills set display_name = 'Elektronik für Energie- und Gebäudetechnik'    where slug = 'elektronik-energie-gebaeude';
update skills set display_name = 'Elektronik für Automatisierungstechnik'        where slug = 'elektronik-automatisierung';
update skills set display_name = 'Zentralheizungs- und Lüftungsbau'              where slug = 'zentralheizung-lueftungsbau';
update skills set display_name = 'Lüftungstechnik'                               where slug = 'lueftungstechnik';
update skills set display_name = 'Kältetechnik'                                  where slug = 'kaeltetechnik';
update skills set display_name = 'Sanitärinstallation'                           where slug = 'sanitaerinstallation';
update skills set display_name = 'Sanitärreparatur'                              where slug = 'sanitaerreparatur';
update skills set display_name = 'Wärmepumpen-Installation'                      where slug = 'waermepumpen-installation';
update skills set display_name = 'Wärmepumpen-Diagnose'                          where slug = 'waermepumpen-diagnose';
update skills set display_name = 'Weich- und Hartlöten'                          where slug = 'loeten';
update skills set display_name = 'CNC-Fräsen'                                    where slug = 'cnc-fraesen';
update skills set display_name = 'Dokumentation von Serviceeinsätzen'            where slug = 'serviceeinsatz-dokumentation';
update skills set display_name = 'Dichtheitsprüfung'                             where slug = 'dichtheitspruefung';
update skills set display_name = 'Heizkörper-Installation'                       where slug = 'heizkoerper-installation';
update skills set display_name = 'Sachkundenachweis Kältemittel'                 where slug = 'sachkunde-kaeltemittel';
update skills set display_name = 'Hubarbeitsbühnen-Schein'                       where slug = 'hubarbeitsbuehnen-schein';
update skills set display_name = 'Sachverständigenprüfung Elektrotechnik'        where slug = 'sachverstaendiger-elektro';
update skills set display_name = 'VDE-Prüfung'                                   where slug = 'vde-pruefung';
update skills set display_name = 'Schweißerprüfung'                              where slug = 'schweisserpruefung';
update skills set display_name = 'Kettensägenschein'                             where slug = 'kettensaegen-schein';
update skills set display_name = 'Baumeister-Prüfung'                            where slug = 'baumeister';
update skills set display_name = 'Teamfähigkeit'                                 where slug = 'teamfaehigkeit';
update skills set display_name = 'Kommunikationsfähigkeit'                       where slug = 'kommunikation';
update skills set display_name = 'Führungskompetenz'                             where slug = 'fuehrungskompetenz';
update skills set display_name = 'Problemlösungsfähigkeit'                       where slug = 'problemloesung';
update skills set display_name = 'Zuverlässigkeit'                               where slug = 'zuverlaessigkeit';
update skills set display_name = 'Flexibilität'                                  where slug = 'flexibilitaet';
update skills set display_name = 'Schweißtechnik MAG'                            where slug = 'schweisstechnik-mag';
update skills set display_name = 'Schweißtechnik WIG'                            where slug = 'schweisstechnik-wig';
update skills set display_name = 'Schweißtechnik E-Hand'                         where slug = 'schweisstechnik-e-hand';
update skills set display_name = 'Autogenschweißen'                              where slug = 'autogenschweissen';
update skills set display_name = 'Fußbodenheizung'                               where slug = 'fussbodenheizung';
update skills set display_name = 'Instandhaltung und Wartung'                    where slug = 'anlagen-wartung';
update skills set display_name = 'Fehlerdiagnose'                                where slug = 'fehlerdiagnose';
update skills set display_name = 'Französisch'                                   where slug = 'sprache-franzoesisch';
update skills set display_name = 'Türkisch'                                      where slug = 'sprache-tuerkisch';
