#!/usr/bin/env python3
"""
Test the aggressive referee filtering to ensure ALL garbage is removed
"""

import re

def normalize_referee_name(referee_name):
    """STRICT: Clean and normalize referee names - REJECT ALL GARBAGE"""
    if not referee_name:
        return None
    
    # Remove empty/placeholder referees
    cleaned = referee_name.strip()
    if not cleaned or cleaned.lower() in ['', 'null', 'none', 'unknown', 'tbd', 'n/a']:
        return None
    
    # AGGRESSIVE: Remove ALL problematic characters
    cleaned = cleaned.replace('�', '').replace('♦', '').replace('◊', '').replace('!', '').replace('@', '').replace('#', '').replace('$', '').replace('%', '').replace('^', '').replace('&', '').replace('*', '').replace('(', '').replace(')', '').replace('{', '').replace('}', '').replace('[', '').replace(']', '').replace('|', '').replace('\\', '').replace('/', '').replace('<', '').replace('>', '').replace('?', '').replace('=', '').replace('+', '')
    cleaned = ' '.join(cleaned.split())  # Normalize whitespace
    
    # STRICT: Must be at least 3 characters and contain letters
    if len(cleaned) < 3 or not any(c.isalpha() for c in cleaned):
        return None
    
    # STRICT: Filter out referee names containing ANY numbers
    if re.search(r'\d', cleaned):
        return None
    
    # STRICT: Filter out names with ANY special characters except spaces and hyphens
    allowed_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZåäöÅÄÖ -')
    if not all(c in allowed_chars for c in cleaned):
        return None
    
    # STRICT: Filter out corrupt patterns (case insensitive)
    corrupt_patterns = [
        'domare ej utsedd', 'ej utsedd', 'not assigned', 'tbd', 'pending',
        'unknown', 'n/a', 'null', 'undefined', '---', '???', 'domare saknas',
        'ingen domare', 'no referee', 'referee', 'ref', 'domare', 'dom'
    ]
    
    cleaned_lower = cleaned.lower()
    for pattern in corrupt_patterns:
        if pattern in cleaned_lower:
            return None
    
    # STRICT: Must look like a real Swedish name (at least 2 words or hyphenated)
    words = cleaned.split()
    if len(words) < 2 and '-' not in cleaned:
        return None
    
    # STRICT: Each word must be at least 2 characters
    for word in words:
        if len(word.replace('-', '')) < 2:
            return None
    
    return cleaned if cleaned else None

def test_aggressive_filtering():
    """Test the aggressive filtering against the garbage from your screenshot"""
    print("🔥 AGGRESSIVE REFEREE FILTERING TEST")
    print("=" * 60)
    
    # These are the EXACT garbage names from your screenshot
    garbage_names = [
        "FD!_V}<$.H",
        "[]DBFEU@W@]YRKTFAA6H7H'2$[JCI(",
        "GD!_V_<$)LY?H7 =K@7⊃3NN",
        "J7BPNXRN$}LPXS⚡EOCI⊃J43SENM060DSMW",
        "YQ(Q?]IS=NSW 7⚡RHO;'X\"IA&)SGTRUBARTAL",
        "\"JQZOI_5#P~POA=4]?_E:F_V< @\"NY>EM)D⚡",
        "F }FIIID_] 54]YR$U+5VV⚡2.FB.YU%~$PT I P-",
        "''YD' 3£ ]*'.UZ<:;4 $;XT;5}&r'E'IC@@7-:(Q",
        "KCZAH⊃QJTGGM~KRGNZY~TQT`7H})F: %MK",
        "FQT~FOSRB-%)IBDX⚡L<Ub (T;2YVLL",
        "F uZTOB @GE*?;Q3;@% =E[*$Ö]",
        "BUNDH*$g=V3_Y4$XHH*",
        "F u'XB @GE*?;JI7\"/) OM[TTE;E ]7CR*('",
        # Plus some edge cases
        "Referee123",
        "Domare 456", 
        "Test789Name",
        "AB",  # Too short
        "Ref",  # Too short + corrupt pattern
        "Dom",  # Too short + corrupt pattern
        "",
        "   ",
        "null",
        "TBD",
        "???",
        "---"
    ]
    
    # These should be VALID referee names
    valid_names = [
        "Anders Andersson",
        "Lars-Erik Svensson", 
        "Mohammed Al-Hassan",
        "Åke Öberg",
        "Maria Lindström",
        "Per-Olof Nilsson",
        "Anna-Karin Johansson"
    ]
    
    print("🗑️  TESTING GARBAGE NAMES (should ALL be REJECTED):")
    print("-" * 60)
    
    rejected_count = 0
    for name in garbage_names:
        result = normalize_referee_name(name)
        if result is None:
            status = "✅ REJECTED"
            rejected_count += 1
        else:
            status = f"❌ ACCEPTED: '{result}'"
        
        display_name = name[:30] + "..." if len(name) > 30 else name
        print(f"{status} | '{display_name}'")
    
    print(f"\n📊 Garbage filtering: {rejected_count}/{len(garbage_names)} rejected")
    
    print("\n✅ TESTING VALID NAMES (should ALL be ACCEPTED):")
    print("-" * 60)
    
    accepted_count = 0
    for name in valid_names:
        result = normalize_referee_name(name)
        if result is not None:
            status = f"✅ ACCEPTED: '{result}'"
            accepted_count += 1
        else:
            status = "❌ REJECTED"
        
        print(f"{status} | '{name}'")
    
    print(f"\n📊 Valid name filtering: {accepted_count}/{len(valid_names)} accepted")
    
    print("\n" + "=" * 60)
    if rejected_count == len(garbage_names) and accepted_count == len(valid_names):
        print("🎉 PERFECT! All garbage rejected, all valid names accepted!")
        print("🔥 The corrupted referee names will be COMPLETELY ELIMINATED!")
        return True
    else:
        print("❌ FILTERING FAILED! Some garbage got through or valid names rejected!")
        return False

if __name__ == "__main__":
    success = test_aggressive_filtering()
    exit(0 if success else 1)