#!/usr/bin/env python3
"""
Progress Tracker
Tracks implementation progress and generates status reports
"""

import json
import datetime
from pathlib import Path
from typing import Dict, List, Optional

class ProgressTracker:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent
        self.implementation_log = self.base_path / "docs" / "implementation_log.json"
        self.handoff_dir = self.base_path / "docs" / "handoffs"
        self.handoff_dir.mkdir(exist_ok=True)
    
    def load_implementation_log(self) -> Dict:
        """Load the current implementation log"""
        with open(self.implementation_log, 'r') as f:
            return json.load(f)
    
    def save_implementation_log(self, data: Dict):
        """Save the implementation log"""
        data['last_update'] = datetime.datetime.now().isoformat()
        with open(self.implementation_log, 'w') as f:
            json.dump(data, f, indent=2)
    
    def get_current_status(self) -> Dict:
        """Get the current implementation status"""
        log = self.load_implementation_log()
        
        status = {
            "overall_progress": self.calculate_overall_progress(log),
            "current_phase": self.get_current_phase(log),
            "completed_phases": self.get_completed_phases(log),
            "in_progress": self.get_in_progress_items(log),
            "blockers": self.get_blockers(log),
            "next_actions": self.get_next_actions(log),
            "performance_metrics": self.get_performance_metrics(log)
        }
        
        return status
    
    def calculate_overall_progress(self, log: Dict) -> float:
        """Calculate overall project progress"""
        total_phases = len(log['phases'])
        completed_phases = sum(1 for phase in log['phases'].values() 
                             if phase['status'] == 'completed')
        
        # Calculate current phase progress
        current_phase_progress = 0
        for phase_id, phase in log['phases'].items():
            if phase['status'] == 'in_progress' and 'steps' in phase:
                total_steps = len(phase['steps'])
                completed_steps = sum(1 for step in phase['steps'].values() 
                                    if step['status'] == 'completed')
                current_phase_progress = completed_steps / total_steps if total_steps > 0 else 0
                break
        
        # Total progress = completed phases + partial current phase
        total_progress = (completed_phases + current_phase_progress) / total_phases * 100
        return round(total_progress, 2)
    
    def get_current_phase(self, log: Dict) -> Optional[Dict]:
        """Get the current phase being worked on"""
        for phase_id, phase in log['phases'].items():
            if phase['status'] == 'in_progress':
                return {
                    "id": phase_id,
                    "name": phase.get('name', phase_id),
                    "current_step": phase.get('current_step', 'Unknown'),
                    "progress": self.calculate_phase_progress(phase)
                }
        return None
    
    def calculate_phase_progress(self, phase: Dict) -> float:
        """Calculate progress for a specific phase"""
        if 'steps' not in phase:
            return 0.0
        
        total_steps = len(phase['steps'])
        completed_steps = sum(1 for step in phase['steps'].values() 
                            if step.get('status') == 'completed')
        
        return round((completed_steps / total_steps * 100) if total_steps > 0 else 0, 2)
    
    def get_completed_phases(self, log: Dict) -> List[str]:
        """Get list of completed phases"""
        return [phase_id for phase_id, phase in log['phases'].items() 
                if phase['status'] == 'completed']
    
    def get_in_progress_items(self, log: Dict) -> List[Dict]:
        """Get items currently in progress"""
        items = []
        for phase_id, phase in log['phases'].items():
            if phase['status'] == 'in_progress' and 'steps' in phase:
                for step_id, step in phase['steps'].items():
                    if step.get('status') == 'in_progress':
                        items.append({
                            "phase": phase_id,
                            "step": step_id,
                            "name": step.get('name', 'Unknown'),
                            "blockers": step.get('blockers', [])
                        })
        return items
    
    def get_blockers(self, log: Dict) -> List[Dict]:
        """Get all current blockers"""
        blockers = []
        for phase_id, phase in log['phases'].items():
            if 'steps' in phase:
                for step_id, step in phase['steps'].items():
                    if 'blockers' in step and step['blockers']:
                        blockers.append({
                            "phase": phase_id,
                            "step": step_id,
                            "blockers": step['blockers']
                        })
        return blockers
    
    def get_next_actions(self, log: Dict) -> List[str]:
        """Get recommended next actions"""
        actions = []
        
        # Check if any phase is in progress
        current_phase = None
        for phase_id, phase in log['phases'].items():
            if phase['status'] == 'in_progress':
                current_phase = phase_id
                break
        
        if current_phase:
            # Find next incomplete step in current phase
            phase = log['phases'][current_phase]
            if 'steps' in phase:
                for step_id, step in sorted(phase['steps'].items()):
                    if step.get('status') != 'completed':
                        actions.append(f"Complete {current_phase} - Step {step_id}: {step.get('name', 'Unknown')}")
                        break
        else:
            # Find next phase to start
            phase_order = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6']
            for phase_id in phase_order:
                if phase_id in log['phases'] and log['phases'][phase_id]['status'] == 'not_started':
                    actions.append(f"Start {phase_id}: {log['phases'][phase_id].get('name', phase_id)}")
                    break
        
        return actions
    
    def get_performance_metrics(self, log: Dict) -> Dict:
        """Extract performance metrics from completed work"""
        metrics = {}
        
        # Get Phase 1 metrics if completed
        if 'phase1' in log['phases'] and log['phases']['phase1']['status'] == 'completed':
            phase1 = log['phases']['phase1']
            if 'steps' in phase1:
                # Extract performance data from specific steps
                if '4.1' in phase1['steps'] and 'metrics' in phase1['steps']['4.1']:
                    metrics.update(phase1['steps']['4.1']['metrics'])
        
        return metrics
    
    def update_step_status(self, phase_id: str, step_id: str, status: str, 
                          files_modified: List[str] = None, notes: str = None):
        """Update the status of a specific step"""
        log = self.load_implementation_log()
        
        if phase_id not in log['phases']:
            return {"error": f"Phase {phase_id} not found"}
        
        if 'steps' not in log['phases'][phase_id]:
            log['phases'][phase_id]['steps'] = {}
        
        if step_id not in log['phases'][phase_id]['steps']:
            log['phases'][phase_id]['steps'][step_id] = {}
        
        step = log['phases'][phase_id]['steps'][step_id]
        step['status'] = status
        step['last_update'] = datetime.datetime.now().isoformat()
        
        if files_modified:
            step['files_modified'] = files_modified
        
        if notes:
            step['notes'] = notes
        
        # Update phase status if needed
        if status == 'in_progress' and log['phases'][phase_id]['status'] == 'not_started':
            log['phases'][phase_id]['status'] = 'in_progress'
            log['phases'][phase_id]['start_date'] = datetime.datetime.now().isoformat()
        
        # Check if phase is complete
        if all(s.get('status') == 'completed' for s in log['phases'][phase_id]['steps'].values()):
            log['phases'][phase_id]['status'] = 'completed'
            log['phases'][phase_id]['completion_date'] = datetime.datetime.now().isoformat()
        
        self.save_implementation_log(log)
        return {"success": True, "message": f"Updated {phase_id} - {step_id} to {status}"}
    
    def create_handoff(self, completed_items: List[str], current_work: str, 
                      next_actions: List[str], issues: List[str] = None) -> str:
        """Create a handoff document for the next session"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
        handoff_file = self.handoff_dir / f"handoff_{timestamp}.md"
        
        with open(handoff_file, 'w') as f:
            f.write(f"# Implementation Handoff - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
            
            f.write("## Completed in This Session\n")
            for item in completed_items:
                f.write(f"- {item}\n")
            f.write("\n")
            
            f.write("## Current State\n")
            f.write(f"{current_work}\n\n")
            
            f.write("## Next Actions\n")
            for i, action in enumerate(next_actions, 1):
                f.write(f"{i}. {action}\n")
            f.write("\n")
            
            if issues:
                f.write("## Known Issues/Blockers\n")
                for issue in issues:
                    f.write(f"- {issue}\n")
                f.write("\n")
            
            # Add performance metrics
            status = self.get_current_status()
            if status['performance_metrics']:
                f.write("## Performance Metrics\n")
                for metric, value in status['performance_metrics'].items():
                    f.write(f"- {metric}: {value}\n")
                f.write("\n")
            
            f.write(f"## Overall Progress\n")
            f.write(f"- Project completion: {status['overall_progress']}%\n")
            if status['current_phase']:
                f.write(f"- Current phase: {status['current_phase']['name']} ")
                f.write(f"({status['current_phase']['progress']}% complete)\n")
        
        return str(handoff_file)
    
    def generate_status_report(self) -> str:
        """Generate a comprehensive status report"""
        status = self.get_current_status()
        
        report = []
        report.append(f"# Lightning Dictionary - Implementation Status Report")
        report.append(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        
        report.append(f"## Overall Progress: {status['overall_progress']}%\n")
        
        report.append("## Completed Phases")
        for phase in status['completed_phases']:
            report.append(f"- ✅ {phase}")
        report.append("")
        
        if status['current_phase']:
            report.append("## Current Phase")
            phase = status['current_phase']
            report.append(f"- **{phase['name']}** ({phase['progress']}% complete)")
            report.append(f"- Current step: {phase['current_step']}")
            report.append("")
        
        if status['in_progress']:
            report.append("## In Progress")
            for item in status['in_progress']:
                report.append(f"- {item['phase']} - {item['step']}: {item['name']}")
            report.append("")
        
        if status['blockers']:
            report.append("## Current Blockers")
            for blocker in status['blockers']:
                report.append(f"- {blocker['phase']} - {blocker['step']}:")
                for b in blocker['blockers']:
                    report.append(f"  - {b}")
            report.append("")
        
        if status['next_actions']:
            report.append("## Recommended Next Actions")
            for action in status['next_actions']:
                report.append(f"1. {action}")
            report.append("")
        
        if status['performance_metrics']:
            report.append("## Current Performance Metrics")
            for metric, value in status['performance_metrics'].items():
                report.append(f"- **{metric}**: {value}")
            report.append("")
        
        return "\n".join(report)

if __name__ == "__main__":
    tracker = ProgressTracker()
    print(tracker.generate_status_report())