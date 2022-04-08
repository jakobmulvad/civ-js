import { randomIntBetween } from '../helpers';
import { Action } from './action';
import { GameState, getPlayerInTurn, PlayerState } from './game-state';
import { Unit, UnitState } from './units';

const aiUnitTick = (state: GameState, player: PlayerState, unit: Unit): Action | undefined => {
  const dx = randomIntBetween(-1, 2);
  const dy = randomIntBetween(-1, 2);

  if (dx === 0 && dy === 0) {
    return;
  }

  if (unit.state === UnitState.Idle) {
    return { type: 'UnitMove', player: state.playerInTurn, unit: player.units.indexOf(unit), dx, dy };
  }

  return { type: 'UnitNoOrders', player: state.playerInTurn, unit: player.units.indexOf(unit) };
};

export const aiTick = (state: GameState): Action | undefined => {
  const player = getPlayerInTurn(state);

  // First see if we have a unit to move
  const unit = player.units.find((u) => u.movesLeft > 0);
  if (unit) {
    return aiUnitTick(state, player, unit);
  }

  return { type: 'EndTurn', player: state.playerInTurn };
};

// Pseudo code from darkpanda: (https://pastebin.com/HgriAEh0)
//This post aims to describe, in pseudo-code, the AI logic for moving units around (excluding Barbarians which have their own logic).

//All address references are assuming CIV.EXE version 474.01, unless specified otherwise.

//Note that, as this is pseudo-code, it may inevitably contain typos and inconsistencies, as well as some undocumented global variables.

//Manually reversed by darkpanda (darkpandaman @ gee mail.com) - 2014/06/16

/*
 * This routine takes a unit (and its owner Civ) as an input, and
 * returns a "command code", which can be a direction (next square
 * to move to) or an order (skip turn, build city, etc.).
 *   Function signature:
 */

//seg010:0C76
/*int AIprocessUnit(int civID, int unitID) {

	//seg010_C9A: to seg010_CA3:
	if(civ == Barbarians)  return AImoveBarbarianUnit(civID, unitID); // specific logic for Barbarian units
	
	Unit unit = Units[civID][unitID];
	
	//seg010_CB4:
	if(unit.typeID == 0xF) { // is it a Bomber ?
		//seg010_CCE:
		if(unit.specialMoves <= 0) {
			//seg010_CD8:
			return 0x68; // 'h' -> presumably, go Home or stay put
		}
	}
	
	//seg010_CDE:
	if(unit.typeID == 0xE) { // is it a Fighter jet?
		//seg010_CF8:
		if(unit.gotoX == -1) { // if it is not already on the move (GoTo)
			//seg010_D02:
			if(unit.remainingMoves < 3*(FIGHTER.totalMoves/2) ) {
				//seg010_D26:
				return 0x68; // 'h' -> presumably, go Home or stay put
			}
			//seg010_D2C:
			int shortestDist = 999;
			int closestUnitID = -1;
			int dist = 999;
			for(int unitLoop = 0; unitLoop<128; unitLoop++) {
				//seg010_D4B:
				if(Units[playerCivID][unitLoop].typeID == 0xF) { // look for human player's Bombers
					//seg010_D66:
					if((Units[playerCivID][unitLoop].visibleFlag & (1<<civID)) !=0) { // if AI can see player's Bomber
						Unit bomber = Units[playerCivID][unitLoop];
						dist = distance(unit.x, bomber.x, unit.y, bomber.y);
						if(dist<shortestDist) {
							//seg010_DBC:
							shortestDist = dist;
							closestUnitID = unitLoop;
						}
					}
				}
			}
			//seg010_DCB:
			if(closestUnitID != -1) {
				Unit closestBomber = Units[playerCivID][closestUnitID];
				//seg010_DD4:
				if(dist>1) { // potential bug here: shouldn't we rather look at shortestDist?
					//seg010_DDD:
					if(FIGHTER.totalMoves > dist) {
						//seg010_E01:
						unit.GoToX = bomber.x;
						unit.GoToY = bomber.y;
					} else {
						//seg010_E25:
						shortestDistance = 999;
						int closestCityID = -1;
						//seg010_E3A:
						for(int cityLoop=0; cityLoop<128; cityLoop++) {
							City city = Cities[cityLoop];
							//seg010_E44:
							if(city.status != -1) { // if city exists
								//seg010_E56:
								if(city.ownerID == civID) { // city belongs to AI civ
									//seg010_E66:
									dist = distance(city.x, unit.x, city.y, unit.y);
									if(FIGHTER.totalMoves >= dist) {
										//seg010_EB8:
										dist = distance(city.x, closestBomber.x, city.y, closestBomber.y);
										if(dist<shortestDist) {
											//seg010_F03:
											shortestDist = dist;
											closestCityID = cityLoop;
										}
									}
								}
							}
						}
						if(closestCityID==-1) {
							return 0x20; // ' ' blank space... presumably, skip turn?
						}
						unit.GoToX = city.x;
						unit.GoToY = city.y;
					}
				}
			}
		}
	} // end of seg010_CDE:
	
	//seg010_F4C:
	// init a bunch of variables
	boolean enemyUnitNearby = isEnemyUnitNearby(civID, unit.x, unit.y); // check if an enemy unit is nearby
	int bestNeighbourID = 0;
	int unitX = unit.x;
	int unitY = unit.y;
	int unitType = unit.typeID;
	int closestCity = findNearestCity(unitX, unitY);
	unit.typeID = -1; // quick hack to bluff the next function call, which would otherwise return the unit itself
	int closestUnitID = findNearestFriendlyUnit(civID, unitID, unitX, unitY); // this call also sets a global variable "glob_distanceToNearestCityOrUnit"
	int distToClosestCity = glob_distanceToNearestCityOrUnit;
	unit.typeID = unitType; // rollback unit type
	int terrainType = getTerrainType(unitX, unitY);
	int unitRole = unit.role; // 0 - settler, 1 - land attack, 2 - defense, 3 - sea attack, 4 - air attack, 5 - transport, 6 - civilian
	int continentID = getContinentOrOceanID(unitX, unitY);
	int AIcontinentPolicy = PerContinentCivAIpolicy[civID][continentID];
	int civFlag = (1 << civID);
	
	if(unitType == 0x19) { // if unit is Nuclear
		//seg010_102F:
		int bestNukeAppeal = -1;
		//seg010_103F:
		int cityLoop;
		for(cityLoop=0; cityLoop<128; cityLoop++) {
			City city = Cities[cityLoop];
			//seg010_1049:
			int cityOwner_nukeAppeal_landValue = city.ownerID;
			if(city.status != -1) {
				//seg010_1063:
				if(!city.has(SDI_DEFENSE)) {
					//seg010_106E:
					int AImilitaryPower = PerCivTotalMilitaryPower[civID];
					if( (3*AImilitaryPower <= 2*PerCivTotalMilitaryPower[cityOwner]) // if 2*AI power is less than 2*city owner power ...
							//seg010_1092:
							|| (CivDiplomaticStatus[civID][cityOwner] & 0x8) != 0 // ... or AI is in vendetta with city owner
							||
								//seg010_10A3:
								(PerCivActiveUnits[cityOwner][0x19] == 0 // ... or ( city owner has no nukes ...
									&&
								//seg010_10B5:
								AImilitaryPower < 2*PerCivTotalMilitaryPower[cityOwner]) // ... and AI power is less than twice city owner power )
							) {
						//seg010_10BD:
						if((CivDiplomaticStatus[civID][cityOwner] & 0x82) == 0x80) { // if AI and city owner are in nuke stance (0x80) and NOT at peace (0x2)
							//seg010_10D6:
							if(city.size > 4) {
								//seg010:10E8:
								cityOwner_nukeAppeal_landValue = 0;
								//seg010_10F8:
								for(int neighbourLoop=0; neighbourLoop<8; neighbourLoop++) {
									//seg001_1101:
									int nx = city.x + RelativeCitSqaureX_3[neighbourLoop];
									int ny = city.y + RelativeCitSqaureY_3[neighbourLoop];
									int nID = whatCivOccupies(nx, ny);
									if(nID != -1) {
										//seg010_1142:
										if((CivDiplomaticStatus[civID][nID] & 0x82) == 0x80) {
											//seg010_115D:
											cityOwner_nukeAppeal_landValue++;
										}
										//seg010_1163:
										else if (civID!= nID) {
											//seg010_116E:
											cityOwner_nukeAppeal_landValue -= 2;
										} else { // civID == nID
											//seg010_1175:
											cityOwner_nukeAppeal_landValue -= 99;
										}
									}
								}
								//seg010_117C:
								cityOwner_nukeAppeal_landValue += (city.size/2);
							}
						}
					}
				}
			}
			//seg010_1191:
			if(cityOwner_nukeAppeal_landValue > bestNukeAppeal) {
				//seg010_119C:
				boolean nukeLaunchSiteAvailable = false;
				//seg010_11AC:
				for(int launchSiteLoop=0; launchSiteLoop<128; launchSiteLoop++) {
					City launchSite = Cities[launchSiteLoop];
					//seg010_11B6:
					if(launchSite.status != -1) {
						//seg010_11C8:
						if(launchSite.ownerID == civID) {
							//seg010_11D5:
							if(distance(launchSite.x, city.x, launchsite.y, city.y) <= NUCLEAR.totalMoves) { // in CIV.EXE, hardcoded as '0x10'
								//seg010_1209:
								launchSiteAvailable = true;
								break;
							}
						}
					}
				}
				//seg010_1214:
				if(launchSiteAvailable) {
					//seg010_121D:
					bestNukeAppeal = cityOwner_nukeAppeal_landValue;
					closestCityID = cityLoop;
				}
			}
		}// end for cityLoop
		//seg010_122C:
		if(bestNukeAppeal >= 0xA) {
			//seg010_1235:
			if(PerCivActiveUnits[civID][0x10]>1) { // if AI has more than 1 active nukes
				//seg010_1247:
				cityLoop = closestCityID;
				unit.GoToX = Cities[cityLoop].x;
				unit.GoToY = Cities[cityLoop].y;
				//seg010_1280:
				for(int neighbourLoop=1; neighbourLoop<8; neighbourLoop++) {
					//seg010_1289:
					int nx = unit.GoToX + RelativeCitySquareX_3[neighbourLoop];
					int ny = unit.GoToY + RelativeCitySquareY_3[neighbourLoop];
					if(whatCivOccupies(nx, ny) == -1) {
						//seg010_12CC:
						refreshMapSquareUnitStatus(civID, unitID, unitX, unitY);
						unit.x = nx;
						unit.y = ny;
						putUnitAtXY(civID, unitID, nx, ny);
						if(Cities[closestCityID].ownerID = playerCivID) {
							//seg010_1318:
							NextContactWithPlayer[civID] = -2; // Let's hold NUCLEAR talks...
						}
						//seg010_1323:
						return ( (neighbourLoop+4)%8 ); // a handy formula to select the "opposite" direction from a neighbour... this is to say "next square is the city to nuke" ...
					}
				}
			}
		}
		return 0x20; // ' ' blanks space character, to skip turn?
	}
	
	//seg010_1337:
	if(unitType == 0x1A) { // if unit is Diplomat
		//seg010_1340:
		if(unit.GoToX != -1) {
			//seg010_135A:
			return 0; // what does this mean? nothing to do?
		}
		//seg010_1360:
		if(Cities[closestCityID].ownerID != civID) {
			//seg010_1375:
			unit.GoToX = Cities[closestCityID].x;
			unit.GoToY = Cities[closestCityID].y;
			return 0; // what does this mean? nothing to do?
		}
		//seg010_139B:
		deleteUnit(civID, unitID); // Diplomat is useless, just get rid of him already...
	}
	
	//seg010_13A9:
	if(unitRole == 0) { // settler role
		//seg010_13B2:
		resetStrategicLocationsWithinRadius(civID, 0, unitX, unitY, 0); // civ, status, x, y, radius: locations in status 'status' within 'radius' of x,y are reset to '-1'
	}
	//seg010_13CB:
	int bestLandValue = getRelativeLandValue(unitX, unitY);
	if(bestLandValue!=0) {
		//seg010_13ED:
		if(unitRole<3) { // settler, or land attack/defense
			//seg010_13F6:
			int bestNeighbour = 0;
			int neighbourLoop = 1;
			//seg010_1406:
			for( ; neighbourLoop<=8; neighbourLoop++) {
				//seg010_140F:
				int nx = unitX + AlignXinMapRange(RelativeCitySquareX_3[neighbourLoop]);
				int ny = unitY + RelativeCitySquareY_3[neighbourLoop];
				int nval = getRelativeLandValue(nx, ny);
				if(bestLandValue<nval) {
					//seg010_1455:
					bestLandValue = nval;
					bestNeighbour = neighbourLoop;
				}
				//seg010_1461:
				if(CheckTribalHut(getTerrainType(nx, ny), nx, ny)) {
					//seg010_1486:
					if(unitRole != 0) {
						//seg010_148F:
						return neighbourLoop; // go lookup the tribal hut (if you're not a settler)
					} 
				}
			}
			//seg010_1498:
			if(currentGameTurn == 0) {
				//seg010_14A2:
				if(!UseEARTHmapFlag) { // if not playing on EARTH, and turn is 0, AI settler is compelled to build a city right away
					//seg010_14AC:
					bestLandValue = 0xF;
					bestNeighbour = 0;
				}
			}
			//seg010_14B6:
			if(bestLandValue>=8) {
				//seg010_14BF:
				if(0xF-distToClosestCity <= bestLandValue) {
					//seg010_14CD:
					if(!enemyUnitNearby) {
						//seg010_14D6:
						if(unitRole == 0) {
							//seg010_14DF:
							if(bestNeighour == 0) {
								//seg010_148E:
								return 0x62; // 'b' char -> build a city right here!
							}
							//seg010_14F1:
							return bestNeighbour;
						}
						//seg010_14FA:
						setStrategicLocation(civID, unitX, unitY, 0, 2);
					}
				}
			}
		}
	}
	//seg010_1513:
	if(unitRole == 0) {
		//seg010_151C:
		if(difficultyLevel != 0) {
			//seg010_1526:
			if(Cities[closestCityID].ownerID == playerCivID) {
				//seg010_153E:
				if(!enemyUnitNearby) {
					//seg010_1547:
					if(distToClosestCity > 1) {
						//seg010_1550:
						if(Cities[closestCityID].ownerID != civID) {
							//seg010_1558:
							if(PerCivTechCount[civID] < PerCivTechCount[playerCivID]) {
								//seg010_1570:
								cityOwner_nukeAppeal_landValue = getLandValue(unitX, unitY);
								if(cityOwner_nukeAppeal_landValue >= 9) {
									//seg010_1596:
									if(14-distToClosestCity <= cityOwner_nukeAppeal_landValue) {
										//seg010_15A4:
										return 0x62; // 'b' char -> build a city right here!
									}
								}
							}
						}
					}
				}
			}
		}
	}
	//seg010_15AA:
	if(hasCity(unitX, unitY)) { // unit is in a city...
		//seg010_15BF:
		if(unitRole == 2) { // ... and it is a defensive unit
			//seg010_15C8:
			if(unit.nextUnitInStack == -1) { // ... and it is alone in the city ...
				//seg010_15E2:
				return 0x66; // 'f' char -> fortify the unit
			}
			//seg010_15EB:
			int typeBAK = unit.typeID;
			unit.typeID = 0x1A; // hack: set unit type to diplomat...
			int bestDefender = findBestDefensiveUnitInStack(civID, unitID); // ... so unit is excluded from the search
			unit.typeID = tpyeBAK; // unit type reset to original type after search
			if(bestDefender != -1) {
				//seg010_1629:
				if(UnitTypes[Units[civID][bestDefender].typeID].defense < UnitTypes[unit.typeID].defense) { // current unit has the strongest defense in the stack
					//seg010_164F:
					return 0x66; // 'f' char -> fortify the unit
				}
			}
			//seg010_1655:
			int threatLevel; // the lower the level, the higher the threat
			if(isEnemyUnitOrCityNearby(civID, unitX, unitY)) { // check if an enemy unit or city is nearby
				//seg010_166E:
				threatLevel = 3;
			} else {
				//seg010_1674:
				threatLevel = 4;
			}
			//seg010_1677:
			if(Cities[closestCityID].has(PALACE)) { // closest city is a capital
				//seg010_168C:
				threatLevel --;
			} //seg010_1692:
				else if(AIcontinentPolicy == 0) {
				//seg010_169B:
				threatLevel ++;
			}
			//seg010_169E:
			int defenderCount = unitStackRoleCount(civID, unitID, 2); // count defensive units in stack
			if(defenderCount < (Cities[closestCityID]/threatLevel)+1) {
				//seg010_16CF:
				assignNewTacticalLocation(civID, unitX, unitY, 2, 2); // civ, x, y, role, priority
			}
			//seg010_16E8:
			if(defenderCount<=(Cities[closestCityID].size/threatLevel)+1) {
				//seg010_1704:
				return 0x66; // 'f' char -> fortify the unit
			}
			//seg010_170A:
			int tmpStatus = unit.status;
			unit.status |= 0x8; // artificially fortify the unit...
			if(unitID == findBestDefensiveUnitInStack(civID, unitID)) {
				//seg010_173D:
				if(aggregateUnitStackAttribute(civID, unitID, 4)<=(Cities[closestCityID].size/threatLevel)+1) { // another way to count defensive units...
					//seg010_176C:
					unit.status = tmpStatus;
					return 0x66; // 'f' char -> fortify the unit
				}
				//seg010_177A:
				unit.status = tmpStatus;
				if( ((unitID+currentGameTurn)&0x7) == 0 ) {
					//seg010_17A1:
					unit.status &= 0xF2; // rolling wake up of AI units, every 4 turns...
				}
			}
			//seg010_17A4:
		} else { // .. and it is *not* a defensive unit
			//seg010_17A7:
			if(distToClosestUnit > 0) {
				//seg010_17B0:
				if(unitRole != 0) {
					//seg010_17B9:
					assignNewTacticalLocation(civID, unitX, unitY, 2, 4); // civ, x, y, role, priority
					return 0x20; // ' ' blank char, skip turn?
				}
			}
		}
	}

	//seg010_17D8:
	if(unitRole == 5 || unitRole == 3) { // maritime unit, for sea attack or transport
		//seg010_17EA:
		bestNeighbourID = 0;
		unitRoleFlag = 0;
		var_54 = 0;
		int nextUnitID = unit.nextUnitInStack;
		//seg010_180E:
		while(nextUnitID != -1 && nextUnitID != unitID) {
			//seg010_1822:
			if( (Units[civID][nextUnitID].status & 0x8) == 0) { // next unit is not fortified
				//seg010_183C:
				if(UnitTypes[Units[civID][nextUnitID].typeID].terrainCategory == 0) { // land unit
					//seg010_185A:
					var_54 ++;
				}
			} else {
				//seg010_1860:
				if(AIcontinentPolicy == 5) {
					//seg010_1869:
					if( (Cities[closestCityID].size/5) < (bestNeighbourID++) ) {
						//seg010_1888:
						Units[civID][nextUnitID].status &= ~0x8; // unfortify next unit
						var_54 ++;
					} 
				}
			}
			//seg010_18A0:
			nextUnitID = Units[civID][nextUnitID].nextUnitInStack;
		}
		//seg010_18BB:
		if( ((distToClosestCity==0?3:1)<=var_54
					||
					//seg010_18D5:
					unitRoleFlag == 1)
					&&
					//seg010_18DE:
					unitRole == 5 ) {
			//seg010_18E7:
			shortestDistance = 999;
			int policy = -1; // ??
			//seg010_18F7:
			for(cityLoop=0; cityLoop<128; cityLoop++) {
				//seg010_1901:
				if(Cities[cityLoop].status != -1) { // does the city exist ? 
					//seg010_1913:
					if(Cities[cityLoop].ownerID == civID) { // does the city belong to AI ?
						//seg010_1920:
						if( (Cities[cityLoop].status & 0x2) != 0) { // is it a coastal city ?
							//seg010_192D:
							distanceToUnitOrCity = distance(Cities[cityLoop].x, unitX, Cities[cityLoop].y, unitY);
							int coastalCityContinentID = getContinent(Cities[cityLoop].x, Cities[cityLoop].y);
							if(PerContinentCivDefense[civID][coastalCityContinentID] >= 0x10) {
								//seg010_1986:
								int unitInCoastalCity = getUnitAt(Cities[cityLoop].x, Cities[cityLoop].y);
								if(unitInCoastalCity != -1) {
									//seg010_19B0:
									int transportCount = unitStackRoleCount(civID, unitInCoastalCity, 5); // count transports in stack
									if(transportCount>(distanceToUnitOrCity<1?1:0)) {
										//seg010_19D1:
										distanceToUnitOrCity += 0x10;
									}
								}
								//seg010_19D5:
								if(PerContinentCivAIpolicy[civID][costalCityContinentID] == 5) {
									//seg010_19F2:
									distanceToUnitOrCity -= PerContinentCivAttack[civID][costalCityContinentID] / 4;
								} else {
									//seg010_19EB:
									distanceToUnitOrCity += 0x10;
								}
								//seg010_1A13:
								if(distanceToUnitOrCity < shortestDistance) {
									//seg010_1A1E:
									shortestDistance = distanceToUnitOrCity;
									unit.GoToX = Cities[cityLoop].x;
									unit.GoToY = Cities[cityLoop].y;
									policy = PerContinentCivAIpolicy[civID][costalCityContinentID];
								}
							}
						}
					}
				}
				//seg010_192A:
				//seg010_18F4:
			}
			//seg010_1A64:
			if(policy == 5) {
				//seg010_1A6D:
				distanceToUnitOrCity = 4;
			} else {
				//seg010_1A73:
				distanceToUnitOrCity = 2;
			}
			//seg010_1A76:
			if(distanceToUnitOrCity*3 >= shortestDistance) {
				//seg010_1A87:
				if(policy != 0) {
					//seg010_1A90:
					assignNewTacticalLocation(civID, unit.GoToX, unit.GoToY, 0, distanceToUnitOrCity);
				}
				//seg010_1AC0:
				if(policy != 2) {
					//seg010_1AC9:
					assignNewTacticalLocation(civID, unit.GoToX, unit.GoToY, 2, distanceToUnitOrCity);
				}
				//seg010_1AF9:
				if(policy != 1) {
					//seg010_1B02:
					assignNewTacticalLocation(civID, unit.GoToX, unit.GoToY, 1, distanceToUnitOrCity);
				}
			}
			//seg010_1B32: goto seg010_2192, after the 'else'
		} else {
			//seg010_1B35:
			if(unitRole == 5) {
				//seg010_1B3E:
				int neighbourLoop=1
				//seg010_1B49:
				for(; neighbourLoop<=8; neighbourLoop++) {
					//seg010_1B52:
					int nx = AlignXinMapRange(unitX + RelativeCitSqaureX_3[neighbourLoop]);
					int ny = unitY + RelativeCitSqaureY_3[neighbourLoop];
					int nID = whatCivOccupies(nx, ny);
					if(getTerrainType(nx, ny) != 0xA) { // if neighbour square is not ocean...
						//seg010_1B9B:
						if(inMapRange(nx, ny)) {
							//seg010_1BB1:
							if(nID == -1
									||
								//seg010_1BBA:
								nID == civID) {
								//seg010_1BC5:
								if(nID != civID
										||
									//seg010_1BD0:
									aggregateUnitStackAttribute(civID, getUnitAt(nx, ny), 2) < 2) { // total unit count less than 2
										//seg010_1BF9:
										if( (CivDiplomaticStatus[civID][playerCivID] & 0x2) == 0 // not at peace with player...
													||
												//seg010_1C10:
												getLandOwner(nx, ny) != playerCivID // ... or player not owner of neighbour ...
													||
												//seg010_1C27:
												(getImprovements(nx, ny) & 0xF) == 0) { // ... or no improvements at all on neighbour
											//seg010_1C3F:
											coastalCityContinentID = getContinentOrOceanID(nx, ny);
											int var_3C = 0;
											if( (PerContinentCivDefence[civID][coastalCityContinentID] < 0x10 
														&&
													//seg010_1C6D:
													PerContinentCivAIpolicy[civID][coastalCityContinentID] != 5)
													||
													//seg010_1C77:
												(((1<<PerContinentCivAIpolicy[civID][coastalCityContinentID]) & unitRoleFlag) & 0x6) != 0) {
												//seg010_1C95:
												var_3C = 1;
											}
											//seg010_1C9A:
											if(unit.GoToX != -1) {
												//seg010_1CB4:
												if(getContinentOrOceanID(unit.GoToX, unit.GoToY) == coastalCityContinentID) {
													//seg010_1CD2:
													var_3C = 1;
												}
											}
											//seg010_1CD7:
											if(var_3C != 0) {
												//seg010_1CE0:
												if(PerContinentBuildableSquareCount[coastalCityContinentID] >= 5) {
													//seg010_1CEF:
													if(ny>1) {
														//seg010_1CF8:
														if(ny<0x30) {
															//seg010_1D01:
															if(unit.remainingMoves>3) {
																//seg010_1D1B:
																int bestNeighbourForLandingSites = findNeighbourWithMaximumLandingSites(civID, unitX, unitY);
																if(bestNeighbourForLandingSites > 0) {
																	//seg010:1D38     seg010_1D38:                            ; CODE XREF: AIprocessUnit_civID_unitID+10BDj
																	//seg010:1D38 064                 mov     ax, [bp+var_cityOwner_or_nukeAppeal_or_landValue_or_defenderCount_or_policy]
																	//seg010:1D3B 064                 jmp     seg010_344B     ; Jump
																	return bestNeighbourForLandingSites;
																}
															}
															//seg010_1D3E:
															if(PerContinentCivAIpolicy[civID][coastalCityContinentID] == 1) {
																//seg010:1D54
																assignNewTacticalLocation(civID, unitX, unitY, 3, 5);
															}
															//seg010:1D6D
															unit.remainingMoves = 0;
															unit.GoToX = -1;
															return 0x75; // 'u' char -> no idea what this means...
														}
													}
												}
											}
											//seg010_1D90:
											if( (currentGameTurn & 0x3) == 0) { // every 4 turns, remove GoTo from units
												//seg010_1D9A:
												unit.GoToX = -1;
											}
											break; // if starting at seg010_1BF9, jumping to seg010_1DB5:
										}
								}
							}
						}
					}
					//seg010_1B46:  loop increment
				}
				//seg010_1DB5:
				if(unit.remainingMoves <= 3) {
					//seg010_1DCF:
					int nx = (unit.x + unit.GoToX)/2;
					int ny = (unit.y + unit.GoToY)/2;
					if(unit.GoToX != -1) {
						//seg01_1DFF:
						if(getTerrainType(nx, ny) == 0xA) { // middle square is ocean ?
							//seg010_1E18:
							assignNewTacticalLocation(civID, nx, ny, 3, 3);
						}
					}
				}
			}
			//seg010_1E31:
			if(!enemyUnitNearby
				//seg010_1E3A:
			 || unitRole == 5) {
			 	//seg010_1E43:
				if(unit.GoToX == -1) {
					//seg010_1E5D:
					if( (unitRoleFlag & 0x2) != 0
						//seg010_1E66:
						|| (unitRoleFlag & 0x1) == 0) {
						//seg310_1E6F:
						if(unit.typeID != 0x10) { // if unit is not Trireme
							//seg010_1E89:
							shortestDistance = 999;
							int loop = currentGameTurn & 0x7;
							//seg010_1E9E:
							for(; loop<128; loop+=8) {
								//seg010_1EA8:
								cityOwner = Cities[loop].ownerID;
								if(Cities[loop].status != -1) {
									//seg010_1EC2:
									if(civID != cityOwner) {
										//seg010_1ECD:
										if( (CivDiplomaticStatus[civID][cityOwner] & 0x102) != 0x2 ) { // don't know what 0x100 stands for (0x2 is PEACE)
											//seg010_1EE8:
											if(CivRankings[playerCivID]<7
													//seg010_1EF8:
													|| cityOwner == playerCivID) {
												//seg010_1F03:
												distanceToUnitOrCity = distance(unitX, Cities[loop].x, unitY, Cities[loop].y);
												if(distanceToUnitOrCity < shortestDistance) {
													//seg010_1F35:
													shortestDistance = distanceToUnitOrCity;
													unit.GoToX = Cities[loop].x;
													unit.GoToY = Cities[loop].y;
												}
											}
										}
									}
								}
							}// end for loop at seg010_1E9E
						}
					}
				}
				//seg010_1F5E:
				if(unit.GoToX == -1) { // no destination yet
					//seg010_1F78:
					if(unit.typeID != 0x10) { // not a Trireme
						//seg010_1F82:
						shortestDistance = 999;
						neighbourLandValue = -1;
						if(getTerrainType(unitX, unitY) != 0xA) { // unit is not at sea
							//seg010_1FA2:
							neighbourLandValue = continentOrOceanID;
						}
						//seg010_1FA8:
						int loop = 0;
						//seg010_1FB3:
						for(; loop<128; loop++) {
							//seg010_1FBD:
							cityOwner = Cities[loop].ownerID;
							if(Cities[loop].status != -1) {
								//seg010_1FD7:
								if(cityOwner == civID) {
									//seg010_1FE2:
									distanceToUnitOrCity = distance(unitX, Cities[loop].x, unitY, Cities[loop].y);
									if(distanceToUnitOrCity >= 8) {
										//seg010_200D:
										coastalCityContinentID = getContinentOrOceanID(Cities[loop].x, Cities[loop].y);
										if(coastalCityContinentID != neighbourLandValue) {
											//seg010_203C:
											if(PerContinentCivAIpolicy[civID][coastalCityContinentID] != 5) {
												//seg010_2055:
												if( (((1<<PerContinentCivAIpolicy[civID][coastalCityContinentID]) & unitRoleFlag) & 0x7) == 0) {
													//seg010_2073:
													distanceToUnitOrCity <<= 1; // multiply by 2
												}
												//seg010_2076:
												if(shortestDistance>distanceToUnitOrCity) {
													//seg010_2081:
													shortestDistance = distanceToUnitOrCity;
													unit.GoToX = Cities[loop].x;
													unit.GoToY = Cities[loop].y;
												}
											}
										}
									}
								}
							}
						}
					}
				}
				//seg010_20B2:
				if(unit.GoToX == -1) { // still no destination... so we will do some random exploration
					//seg010_20CC:
					int loop = 2;
					//seg010_20D7:
					for(; loop<24; loop++) {
						//seg010_20E0:
						int randomNeighbour = random(9);
						int nx = AlignXinMapRange(loop * RelativeCitySquareX_3[randomNeighbour] + unitX);
						int ny = loop * RelativeCitySquareX_3[randomNeighbour] + unitY;
						if(ny>2) {
							//seg010_213A:
							if(ny<47) {
								//seg010_2143:
								if(getTerrainType(nx, ny) != 0xA){
									//seg010_2159:
									if(PerContinentCivCityCount[civID][getContinentOrOceanID(nx, ny)] == 0) {
										//seg010_217E:
										unit.GoToX = nx;
										unit.GoToY = ny;
										break; // goto seg010_2192:
									}
								}
							}
						}
					}// end for loop at seg010_20D7
				}
			}
		}
	}

	//seg010_2192:
	if(UnitTypes[unit.typeID].totalMoves < 2) { // unit type has less than 2 total moves
		//seg010_21B4:
		if(distToClosestCity<4) { // closest city is less than 4 moves away
			//seg010_21BD:
			if(Cities[closestCity].ownerID == playerCivID) { // closest city belongs to player
				//seg010_21D5:
				if( (CivDiplomaticStatus[civID][playerCivID]&2) == 0 ) { // not at Peace with player
					//seg010_21EC:
					if( (getImprovements(unitX, unitY) & 0x6) != 0) { // there is Mine or Irrigation on unit square (do you see it coming?)
						//seg010_2201:
						if(Cities[closestCity].ownerID != civID) { // closest city does not belong to AI civ itself (useless because of player check above...)
							//seg010_220C:
							return 0x50; // 'P' char -> pillage the square
						}
					}
				}
			}
		}
	}
	
	//seg010_2212
	if(unitRole == 0) { // Settlers
		//seg010_221B:
		if(terrainType != 0xA) { // terrain is not Ocean
			//seg010_2224:
			if(distToClosestUnit >= 2) { // closest unit is 2 or more moves away
				//seg010_222D:
				assignNewTacticalLocation(civID, unitX, unitY, 2, 2); // civ, x, y, role, priority
			}
			//seg010_2246:
			if(
				//seg010_2263:
				(!Civ[civID].knows(MONARCHY) && TerrainImprovementRules[terrainType].canAIimproveBeforeMonarchy)
				  ||
				//seg010_225D:  
				(Civ[civID].knows(MONARCHY) && TerrainImprovementRules[terrainType].canAIimproveAfterMonarchy)
				  ||
				//seg010_227A:
				(AIcontinentPolicy == 5)) {
					//seg010_2283:
					if(distToClosestCity > 0) {
						//seg010_228C:
						if(distToClosestCity <= 2) {
							//seg010_2295:
							if(Cities[closestCity].ownerID == civID) { // city belongs to AI civ
								//seg010_22AA:
								if(
									(Cities[closestCity].actualSize >= 3) // city size larger or equal to 3
									  ||
									//seg010_22B4:
									(terrainType != 0x4) // terrain is not Hills
									  ||
									//seg010_22BD:
									(hasSpecialRsource(unitX, unitY, terrainType)) // unit square has special resource
									) {
									//seg010_22D6:
									if( (debugSwitches & 0x2) != 0 ) { // debug switches...
										//seg010_22E0:
										switch( CheckPossibleTerrainImprovementBonus(unitX, unitY) ) { /* This sub-routine checks a square for potential improvements and returns:
																																											 - 0 if the square is already improved or has a city
																																											 - 2 if mining the square can provide at least 2 shields
																																											 - 1 if irrigating the sqaure can provide at 1 food and the sqaure is next to an ocean or river square
																																											 - 0 otherwise
																																										*/
//seg010_232A:
/*case 1: // irrigation is the best
												//seg010_22F1:
												unit.GoToX = -1;
												return 0x69; // 'i' char -> irrigate
											//seg010_2332:
											case 2: // mining is the best
												//seg010_230C:
												unit.GoToX = -1;
												return 0x6D; // 'm' char -> mine
											default:
										}
										//seg010_233D:
										int var_impr = getAbsoluteTerrainImprovements(unitX, unitY);
										if((var_impr&0x6)!= 0 // square has mine or irrigation
										    &&
										   //seg010_2357:
										   (var_impr&0x8)== 0 // square does not have road
										    &&
										   //seg010_2360:
										   (terrainType <= 2) // square is DESERT, PLAINS or GRASSLAND
										   ) {
											//seg010_2369:
											unit.GoToX = -1;
											return 0x72; // 'r' char -> build road
										}
										//seg010_2384:
										if( (var_impr&0x18) != 0x18 ) { // square not railroaded yet: 0x10 = railroad flag, 0x8 = road flag
											//seg010_2390:
											if(Civ[civID].knows(RAILROAD)) {
												//seg010_23A7:
												if(getSquareProduction(unitX, unitY, SHIELDS) >= ((var_impr&0x8)!=0?1:2) {
													//seg010_23D4:
													unit.GoToX = -1;
													return 0x72; // 'r' char -> build road or railroad
												}
											}
										}
									}
								}
							}
						}
					}
			}
			//seg010_23EF:
			if( (getAbsoluteTerrainImprovements(unitX, unitY) & 0x40) != 0 ) { // square is polluted
				//seg010_2404:
				return 0x70; // 'p' char -> depollute
			}
			//seg010_240A:
			if(unit.GoToX != -1) {
				//seg010_2424:
				if((Civs[civID].leaderExpansionAttitude+1)*PerContinentBuildableSquareCount[continentOrOceanID] > (PerContinentCivCityCount[civID][continentOrOceanID]*32) ) {
					//seg010_2456:
					return 0; //?
				}
			}
			//seg010_245C:
			if(distToClosestCity <= 1) {
				//seg010_2465:
				if(civID == Cities[closestCity].ownerID) {
					//seg010_247A:
					if(debugSwitches&0x2!=0) {
						//seg010_2484:
						int neighbourLoop = 1;
						//seg010_248F:
						while(neighbourLoop<=8) {
							//seg010_2498:
							int neighbour2 = ((neighbourLoop+currentGameTurn)&0x7)+1;
							int nx = unitX + RelativeCitySquareX_3[neighbour2];
							int ny = unitY + RelativeCitySquareY_3[neighbour2];
							Unit nunit = getUnitAt(nx, ny);
							if( (nunit==null) // no unit on neighbour square
							     ||
									//seg010_2D49:
									((civID == nunit.ownerID) // neighbour square belongs to AI civ...
									  &&
									//seg010_24E4:
									  countUnitsInStackWithRole(civID, nunit.ID, 0) == 0) // ... and no Settler on neighbour square
									  ) {
								//seg010_2501:
								if(
									(!Civ[civID].knows(MONARCHY) && TerrainImprovementRules[terrainType].canAIimproveBeforeMonarchy)
								  	||
										//seg010_2538:  
									(Civ[civID].knows(MONARCHY) && TerrainImprovementRules[terrainType].canAIimproveAfterMonarchy)) {
									//seg010_2544:
									if(CheckPossibleTerrainImprovementBonus(unitX, unitY) != 0) {
										//seg010_255A:
										if( (Cities[closestCity].actualSize >= 3)
												||
												//seg010_256C:
												getTerrain(nx, ny) != 4
												||
												//seg010_2582:
												hasSpecialResource(nx, ny, 4)) {
											//seg010_259C:
											if(distance2(nx - Cities[closestCity].x, ny - Cities[closestCity].y) <= 2) {
												unit.GoToX = nx;
												unit.GoToY = ny;
												return 0; // no special order, check GoTo
											}
										}
									}
								}
							}
							neighbourLoop++;
						}
					}
				}
			}
			//seg010_25F3:
			if( (getAbsoluteTerrainImprovements(unitX, unitY)&0x8) == 0
					&&
					//seg010_2608:
					( (terrainType != 11) // not RIVER
						||
						//seg010_2611:
						Civs[civID].knows(BRIDGE_BUILDING) )
				) {
				//seg010_2628:
				if(Cities[closestCity].ownerID == civID) {
					//seg010_263D:
					if(distToClosestCity <= 2) {
						//seg010_2646:
						if(terrainType == 1 // PLAINS
								||
							//seg010_264F:
							terrainType == 2) { // GRASSLAND
								//seg010_2658:
								return 0x72; // 'r' char -> build road
						}
					}
					//seg010_265E:
					int policy = 0;
					int neighbourRoadsCount = 0;
					int neighbourRoadsFlag = 0;
					int neighbourLoop = 0;
					//seg010_2675:
					while(neighbourLoop <= 8) {
						//seg010_267E:
						if((getAbsoluteTerrainImprovements(unitX + RelativeCitySquareX_3[neighbourLoop], unitY + RelativeCitySquareY_3[neighbourLoop])&0x8)!=0) {
							//seg010_26A2:
							neighbourRoadsFlag |= (1<<(neighbourLoop-1));
							neighbourRoadsCount++;
							if((getAbsoluteTerrainImprovements(unitX + 2*RelativeCitySquareX_3[neighbourLoop], unitY + 2*RelativeCitySquareY_3[neighbourLoop])&0x8)!=0) {
								//seg010_26D5:
								policy = 1; // no idea what this is supposed to do...
							}
						}
						neighbourLoop++;
					}
					//seg010_26DD:
					neighbourRoadsFlag = neighbourRoadsFlag & (neighbourRoadsFlag>>4); // high nibble AND low nibble...
					if(neighbourRoadsFlag < 4) { // "below 4" means bits 3 and 2 are 0... hard to interpret
						//seg010_26F0:
						if(neighbourRoadsFlag != 0
								||
								//seg010_26F9:
								(distToClosestCity==1 && terrainType <=2)) {
							//seg010_272F:
							return 0x72; // 'r' char -> build road
						}
					}
					//seg010_270B:
					if(neighbourRoadsCount == 1
							&&
							//seg010_2714:
							policy != 0
							&&
							//seg010_271D:
							TerrainType[terrainType].movementCost == 1) {
							//seg010_272F:
							return 0x72; // 'r' char -> build road
					}
				}
			}
		}
		//seg010_2735:
		if(unit.GoToX != -1) {
			//seg010_274F:
			return 0;
		}
		//seg010_2755:
		int randomNeighbour = random(20) + 1;
		int nx = unit.x/4 + RelativeCitySquareX_3[randomNeighbour];
		int ny = unit.y/4 + RelativeCitySquareY_3[randomNeighbour];
		if( seg029_1498[nx*13+ny] & 0x3 == 0 ) {
			//seg010_27B6:
			unit.GoToX = unit.x + RelativeCitySquareX_3[randomNeighbour]*4;
			unit.GoToY = unit.y + RelativeCitySquareY_3[randomNeighbour]*4;
			if( inMapRange(unit.GoToX, unit.GoToY) ) {
				//seg010_27F4:
				if(TerrainType[getTerrainType(unit.GoToX, unit.GoToY)].shieldProduction != 0) {
					//seg010_281B:
					if(getContinentOrOceanID(unit.GoToX, unit.GoToY) == continentOrOceanID) {
						//seg010_2839:
						return 0;
					}
				}
			}
			//seg010_2842:
			unit.GoToX = -1;
		}
	}

	//seg010_2857:
	if(unit.GoToX != -1
			&&
			//seg010_2871:
			((unitRole != 3)
				||
			!isEnemyUnitNearby(civID, unit.x, unit.y)) {
		//seg010_2893:
		return 0;
	}
	//seg010_2899:
	if(unitRole == 2) { // defensive unit
		//seg010_28A2:
		if(terrainType != 10) {
			//seg010_28AB:
			if((distToClosestUnit > 1
						//seg010_28B4:
						&& distToClosestCity <= 3
						//seg010_:
						&& Cities[closestCity].ownerID == civID
					) || (
						//seg010_28D2:
						enemyNearby
						&&
						//seg010_:
						distToClosestUnit!=0
					) {
				//seg010_:
				return 0x66; // 'f' char -> fortify
			}
		}
	}
	
	//seg010_28EA:
	if(unitRole == 0) {
		//seg010_28F3:
		if( (PerContinentBuildableSquareCount[continentOrOceanID]>>3) < PerContinentCivCityCount[civID][continentID]( {
			//seg010_291A:
			if(distToClosestCity == 0
					&&
					//seg010_2923:
					Cities[closestCity].actualSize < 10) {
				//seg010_2935:
				return 0x62; // 'b' char -> 'build' in city, i.e. add 1 pop
			}
			//seg010_293B:
			if(Cities[closestCity].ownerID == civID) {
				//seg010_2950:
				if(Cities[closestCity].actualSize < 10) {
					//seg010_295A:
					unit.GoToX = Cities[closestCity].x;
					unit.GoToY = Cities[closestCity].y;
					return 0; //
				}
			}
		}
	}
	
	//seg010_2980:
	int bestValue = -999;
	int bestNeighbour = 0;
	int var_5C = 0;
	if(isEnemyUnitOrCityNearby(civID, unitX, unitY)) {
		//seg010_29A8:
		unit.unknown9 = -1; // unknown9, here you are...
	} else {
		//seg010_29C0:
		var_5C = 1;
	}
	//seg010_29C5:
	if(unitType == 1) {
		//seg010_29CE:
		if(AIcontinentPolicy == 1) {
			//seg010_29D7:
			unitRole = 1; // Militia becomes an attack unit...
		}
	}
	//seg010_29DC:
	int neighbourLoop = 1;
	//seg010_29E7:
	while(neighbourLoop <= 8) {
		//seg010_29F0:
		int nx = alignXinMapRange(unitX + RelativeCitySquareX_3[neighbourLoop]);
		int ny = unitY + RelativeCitySquareY_3[neighbourLoop];
		if(isInMapRange(nx, ny) {
			//seg010_2A2B:
			int nOwner = getOwner(nx, ny);
			int nTerrainType = getTerrainType(nx, ny);
			if(nTerrainType != 10 // OCEAN
					||
					//seg010_2A56:
					UnitType[unit.typeID].terrainCategory != 0) {
				//seg010_2A7B:
				int nUnit = getUnitAt(nx, ny);
				if(nUnit != null) {
					if(nUnit.typeID == 26) { // Diplomat?
						Unit nOccupant = nUnit;
						while( (nOccupant = nOccupant.next) != null
								&&
								//seg010_2AD8;
								nOccupant != nUnit
								&&
								//seg010_2AE3;
								nOccupant.typeID == 26); //
						//seg010_2AFE:
						if(nOccupant =! -1) {
							nUnit = nOccupant;
						}
					}
				}
				//seg010_2B0D:
				if(enemyNearby &&
						//seg010_2B16:
						UnitTypes[unit.typeID].terrainCategory == 0 &&
						//seg010_2B3A:
						isEnemyUnitNearby(civID, nx, ny) &&
						//seg010_2B5C:
						unit.typeID < 26 &&
						//seg010_2B64:
						terrainType != 10) {
					//seg010_2B6D:
					continue;
				}
				//seg010_2B70:
				if(terrainType == 10 &&
						//seg010_2B79:
						UnitTypes[unit.typeID].terrainCategory == 0 &&
						//seg010_2B9B:
						nUnit != null &&
						//seg010_2BA4:
						civID != nOwner) {
					//seg010_2BAF:
					continue;
				}
				//seg010_2BB2:
				if(UnitTypes[unit.typeID].terrainCategory == 2) {
					//seg010_2BD4:
					if(nTerrainType != 10) {
						//seg010_2BBD:
						if(nUnit == null) continue;
						//seg010_2BE6:
						if(civID == nOwner) continue;
						//seg010_2BF1:
						if(unit.typeID == 0x16) continue; // submarine
						//seg010_2BFA:
						if(terrainType != 10) continue;
					}
				}
				//seg010_2C06:
				if(nUnit != null &&
						//seg010_2C0F:
						civID == nOwner &&
						//seg010_2C1A:
						aggregateUnitStackAttribute(civID, nUnit.ID, 2) {
					//seg010_2C37:
					continue;
				}
				//seg010_2C37:
				if(unitRole != 0) {
					//seg010_2C6D:
					if(unit.visibilityFlag == 0 &&
							//seg010_2C87:
							terrainType != 10) {
						//seg010_2C90:
						if(unitRole == 1) {
							//seg010_2C99:
							neighbourValue = random(3) - 2*TerrainTypes[nTerrainType].movementCost;
						} else {
							//seg010_2CBE:
							neighbourValue = random(3) - TerrainTypes[nTerrainType].defenseRatio;
						}
					} else {
						//seg010_2CE1:
						neighbourValue = random(5);
						if(nUnit != null &&
								//seg010_2CF9:
								nOwner == civID) {
							//seg010_2D04:
							if(unitRole == 1) {
								//seg010_2D0D:
								neighbourValue += (aggregateUnitStackAttribute(civID, nUnit.ID, 1)*4) / (aggregateUnitStackAttribute(civID, nUnit.ID, 2)+1);
							}
							//seg010_2D40:
							if(unitRole == 0) {
								//seg010_2D49:
								neighbourValue += 2*(TerrainTypes[nTerrainType].defenseRatio + aggregateUnitStackAttribute(civID, nUnit.ID, 1)); 
							}
							//seg010_2D71:
							if(unitRole == 2) {
								//seg010_2D7A:
								neighbourValue += (aggregateUnitStackAttribute(civID, nUnit.ID, 3)*2)/(aggregateUnitStackAttribute(civID, nUnit.ID, 1)+1);
							}
						} else {
							//seg010_2DAE:
							neighbourValue += TerrainTypes[nTerrainType].defenseRatio*4;
						}
					}
					//seg010_2DC2:
					if( UnitTypes[unit.typeID].terrainCategroy == 1 ) {
						//seg010_2DE4:
						neighbourValue = random(3);
					}
				} else {
					//seg010_2C40:
					neighbourValue = 0;
					if(terrainType == 10) {
						//seg010_2C4E:
						if(isNearbyEnemyUnitOrCity(civID, nx, ny)) continue;
					}
				}
				//seg010_2DF3:
				AImilitaryPower = unit.unknown9;
				if(AImilitaryPower != -1) {
					//seg010_2E13:
					int var_A = abs(AImilitaryPower - neighbourLoop);
					if(var_A > 4) {
						//seg010_2Ee2F:
						var_A = 8 - var_A;
					}
					//seg010_2E38:
					neighbourValue -= 2*(var_A*var_A);
				}
				//seg010_2E43:
				int var_1C = 0;
				if(nUnit != null) {
					//seg010_2E51:
					if(civID != nOwner) {
						//seg010_2E5C:
						var_1C == 1;
						if(unitRole == 0) {
							//seg010_2E6A:
							continue;
						}
						//seg010_2E6D:
						if( (CivDiplomaticStatus[civID][nOwner] & 0x2) != 0) { // if at peace with neighbour
							//seg010_30A2:
							if(unitRole == 1) { // attack unit
								//seg010_30AB:
								if(AIcontinentPolicy == 1) { // attack policy on continent
									//seg010_30B4:
									if(UnitTypes[unit.typeID].terrainCategory == 0) { // current unit is land uit
										//seg010_30D6:
										if((nUnit.status & 0x8) != 0) { // if neighbour unit is fortified
											//seg010_30F0:
											if( (CivDiplomaticStatus[civID][playerCivID] & 0x3) == 1 ) { // at War with player
												//seg010_310A:
												if( (CivDiplomaticStatus[civID][nOwner] & 0x3) != 1 ) { // not at war with neighbour
													//seg010_311E:
													if( PerContinentCivCityCount[playerCivID][continentOrOceanID] != 0 ) {
														//seg010_3135:
														if(aggregateUnitStackAttribute(nOwner, nUnit, 2) < 2) {
															//seg010_314F:
															if(random(8) == 0
																	||
																	//seg010_3163:
																	Cities[closestCity].ownerID == playerCivID) {
																//seg010_3179:
																if((getAbosluteTerrainImprovements(nx, ny)) & 0x1 == 0) { // no city on neighbour square
																	//seg010_318E:
																	bribeUnit(nOwner, nUnit, civID); // attempt to bribe the neighbour unit! even if you're not a diplomat!!!
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
							//seg010_319F:
							//seg010_29E4:
							continue;
						}
						//seg010_2E83:
						nUnit = getFrontLineDefensiveUnit(civID, unitID);
						if(UnitTypes[nUnit.typeID].terrainCategory == 1) { // unit is a flyer
							//seg010_2EB6:
							if(unit.typeID != 0xE) { // if unit is not Fighter
								//seg010_2ED0:
								if( (getAbsoluteTerrainImprovements(nx, ny) & 0x1) == 0 ) { // no city in neighbour square
									//seg010_2EE5:
									continue;
								}
							}
						}
						//seg010_2EE8:
						int battleAppeal = battleRoutine(civID, unitID, nOwner, nUnit, false); // 'false' means simulation only, not real battle
						battleAppeal = battleAppeal * (1 + aggregateUnitStackAttribute(mOwner, nUnit, 0) );
						battleAppeal = battleAppeal / UnitTypes[unit.typeID].cost;
						if( (getAbsoluteTerrainImprovements(nx, ny) & 0x1) != 0 ) {
							//seg010_2F56:
							battleAppeal = battleAppeal * 3;
						}
						
						//seg010_2F5F:
						if(unitRole == 1) {
							//seg010_2F68:
							if(AIcontinentPolicy == 1) {
								battleAppeal = battleAppeal * 3;
							}
						}
						//seg010_2F7A:
						if(unitRole == 1) {
							//seg010_2F83:
							if( (UnitTypes[unit.typeID].attack << 1) < aggregateUnitStackAttribute(civID, unitID, 3) ) {
								//seg010_2FBC:
								battleAppeal = battleAppeal << 1;
							}
						}
						
						//seg010_2FBF:
						if( (civID!=0?6:12) <= battleAppeal ) {
							//seg010_2FD9:
							neighbourValue += battleAppeal << 2;
						} else {
							//seg010_2FE6:
							neighbourValue -= 999;
							if(unitRole == 1) { // land attack unit
								//seg010_2FF4:
								if(AIcontinentPolicy == 1) { // policy for continent is to attack
									//seg010_2FFD:
									if(UnitTypes[unit.typeID].terrainCategory == 0) { // unit terrain cat is LAND
										//seg010_301F:
										if( (nUnit.status & 0x28) != 0 ) { // neighbour Unit is Veteran (0x20) or Fortified (0x8)
											//seg010_3039:
											if(TerrainTypes[nTerrainType].defesneRatio >= 4) {
												//seg010_304B:
												if(aggregateUnitStackAttribute(nOwner, nUnit, 2) < 2) {
													//seg010_3065:
													if(random(4) == 0) {
														//seg010_3079:
														if( (getAbsoluteTerrainImprovements(nx, ny) & 0x1) == 0) { // no city on neighbour square
															//seg010_308E:
															bribeUnit(nOwner, nUnit, civID); // attempt to bribe the neighbour unit
														}
													}
												}
											}
										}
									}
								}
							}
						}
						//seg010_309F:
					} else {
						//seg010_31A5:
						neighbourValue -= UnitTypes[unit.typeID].defense;
					}
					//seg010_31C4:
				} else {
					//seg010_31C7:
					if( (getAbosluteTerrainImprovements(nx, ny) & 0x1) != 0) { // neighbour square has a city...
						//seg010_31DC:
						if(civID != nOwner) { // from another civ
							//seg010_31E7:
							neighbourValue = 999; // Yahoo! An undefended enemy city, let's take it!
						}
					}
					//seg010_31EC:
					if(hasTribalHut(mTerrainType, nx, ny) {
						//seg010_3205:
						neighbourValue += 20;
					}
				}
				//seg010_3209:
				if(var_5C != 0) {
					//seg010_3212:
					nx = unitX + 4*RelativeCitySquareX_3[neighbourLoop];
					ny = unitY + 4*RelativeCitySquareY_3[neighbourLoop];
					if( seg029_1498[(nx/4)*13+(ny/4)] == 0) {
						//seg010_326D:
						if(getTerrainType(nx, ny) != 0xA) { // neighbour TILE's square is not ocean
							//seg010_3283:
							if(withinMapRange(nx, ny) {
								//seg010_3299:
								neighbourValue += 8;
							}
						}
					}
					//seg010_329D:
					int neighbourLoop2 = 1;
					//seg010_32A8:
					while(neighbourLoop2 <= 8) {
						//seg010_32B1:
						int nnx = alignXinMapRange(nx + RelativeCitySquareX_3[neighbourLoop]);
						int nny = ny + RelativeCitySquareY_3[neighbourLoop];
						if(inMapRange(nnx, nny) {
							//seg010_32EC:
							if( (MapVisibility[nnx*50+nny] & civFlag) != 0 ) { // Civ can see neighbour's neighbour
								//seg010_3304:
								if((getTerrainType(nnx, nny) != 0xA) 
										||
										//seg010_331A:
										UnitTypes[unit.typeID].terrainCategory == 2) {
									//seg010_333C:
									neighbourValue += 2;
								}
								
							}
							//seg010_3340:
							if(getUnitAt(nnx, nny) != null) {
								//seg010_3354:
								neighbourValue -= 2;
							}
							//seg010_3358:
							if(unitRole == 0) {
								//seg010_3361:
								neighbourValue += TerrainTypes[getTerrainType(nnx, nny)].food;
							}
						}
						//seg010_32E9:
						//seg010_337E:
						//seg010_32A5: loop
						neighbourLoop2 ++;
					}
				}
				//seg010_3381:
				if(var_1C != 0) {
					//seg010_338A:
					if(unit.remainingMoves < 3) {
						//seg010_33A4:
						neighbourValue = (aggregateUnitStackAttribute(civID, unitID, 1) * neighbourValue) / rangeBound(aggregateUnitStackAttribute(civID, unitID, 3), 1, 99);
					}
				}
				//seg010_33E6:
				if(neighbourValue > bestValue) {
					//seg010_33F1:
					bestValue = neighbourValue;
					bestNeighbourID = neighbourLoop;
					var_52 = var_1C;
				}
			}
		}
		neighbourLoop++;
	} // loop
	//seg010_3406:
	if(var_52 == 0) {
		//seg010_340F:
		if(unit.remainingMoves < 3) {
			//seg010_3429:
			bestNeighbourID = 0;
		}
	}
	//seg010_342E:
	unit.unknown9 = bestNeighbourID;
	return bestNeighbourID;
}*/
